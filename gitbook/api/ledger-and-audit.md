# Ledger events, contract governance and audit

Three read-only endpoints. All need a bearer token.

## `GET /v1/ledger/events`

The indexer's event stream, **filtered to the circles the caller belongs to**. The API fetches a page from the indexer, keeps events whose pool belongs to one of the caller's circles (resolving rights to pools where needed), and returns them. The `nextCursor` advances over filtered-out events too, so a client never re-reads other pools' pages.

Query:

| Name | Rule | Default |
|---|---|---|
| `cursor` | event id matching `^\d{19}-\d{10}$` | start |
| `limit` | integer 1 to 200 | 50 |

Response `200` (shape of the indexer's events response):

```json
{
  "schemaVersion": 1,
  "network": "testnet",
  "events": [
    { "id": "0000000000000000002-0000000000", "ledger": 902, "ledgerClosedAt": "2026-03-01T00:00:00.000Z",
      "txHash": "723048788e868fec3af088e0a19f3b50f561b0ae4a5af44f83734c14165c145c", "contractId": "CADQOBYH…P5KR",
      "name": "funded", "refs": { "poolId": "1" }, "data": { "amount": "10000000000" }, "finality": "CONFIRMED" }
  ],
  "nextCursor": "0000000000000000003-0000000000",
  "indexerStatus": "SYNCED"
}
```

(synthetic sample.) A bad cursor is `400`. An unreachable indexer is `503 INDEXER_UNREACHABLE`.

## `GET /v1/contract`

Contract governance as the indexer derives it. Not limited to a circle, but it does need a signed-in user.

```json
{
  "contractId": "CADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQP5KR",
  "abiVersion": 2,
  "admin": "GAGCHSTWHAUDETF3L454Z7WDT7H57GYZZWRDO5NJ2EVMFGPLREWKTG23",
  "pendingAdmin": null,
  "pendingUpgrade": { "wasmHash": "abababababababababababababababababababababababababababababababab", "executableAfter": 1772928000, "proposedAtLedger": 950 },
  "upgradesLocked": false,
  "upgrades": [],
  "indexerStatus": "SYNCED",
  "latestObservedLedger": 1000
}
```

(synthetic sample with a pending upgrade to show the shape.) The web app uses `pendingUpgrade` to show an upgrade disclosure banner. On the real deployment `admin` is `null` until the first admin rotation, and `pendingUpgrade` is `null`. See [Governance and upgrades](../contract/governance.md).

## `GET /v1/circles/{id}/audit`

The audit trail of a circle: who did what, when, with which request id. Allowed for the circle's **organizer** or a user with the `auditor` role.

{% hint style="info" %}
The circle must also be one the caller is a member of. A circle the caller does not belong to returns `404`, even for an auditor. An auditor therefore needs to be a member of the circle they audit.
{% endhint %}

Query:

| Name | Rule | Default |
|---|---|---|
| `cursor` | an audit id starting `aud_` | start |
| `limit` | integer 1 to 200 | 50 |

Response:

```json
{
  "events": [
    { "id": "aud_mFJ7K9M2TzYIRGpTbI03ew", "at": "2026-03-01T00:00:00.000Z", "actor": "usr_2a5dd70f21e3d7d4604eeaf5",
      "scope": "circle:cir_JYTKGl9r-_ET7GTUNDo-Gg", "action": "circle.create", "object": "cir_JYTKGl9r-_ET7GTUNDo-Gg",
      "requestId": "req_64a34d52-1bf0-43ac-badc-7d746c9cc651" }
  ],
  "nextCursor": "aud_mFJ7K9M2TzYIRGpTbI03ew"
}
```

Recorded actions include `auth.login`, `circle.create`, `invitation.create`, `invitation.accept`, `intent.submit`, `intent.confirmed` and `intent.reconciling`. The audit log never contains secrets or tokens. Entries are appended in order, and the cursor is an audit id.

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_CURSOR` | the cursor matches no audit entry |
| 403 | `FORBIDDEN` | the caller is neither the organizer nor an auditor |
| 404 | `NOT_FOUND` | the caller is not a member of the circle |

## Becoming an auditor

The `auditor` role is not requested through the API. The operator lists auditor addresses in the `AUDITOR_ADDRESSES` environment variable (comma-separated). A user who signs in with a listed address gets `roles: ["user", "auditor"]`.
