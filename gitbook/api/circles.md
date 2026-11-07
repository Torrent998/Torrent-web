# Circles and invitations

A circle is the off-chain agreement. These endpoints create it, list it and add members through single-use invitations. None of them touches the chain. All need a bearer token. Sample payloads are from the API's example file (synthetic ids).

## `POST /v1/circles`

Creates a circle. The caller becomes its organizer. No `Idempotency-Key` is required.

Request:

```json
{
  "name": "Ajo",
  "ruleSet": {
    "tokenContractId": "CAEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQTD2L",
    "maxMembers": 4,
    "rounds": 3,
    "roundLengthDays": 30,
    "contributionAmount": "100",
    "transferPolicy": "MEMBERS_ONLY"
  }
}
```

| Field | Rule |
|---|---|
| `name` | 1 to 80 characters, trimmed |
| `ruleSet.tokenContractId` | contract address `C…` or account `G…` (56 characters). Synthetic Testnet assets only. |
| `ruleSet.maxMembers` | integer 2 to 50 |
| `ruleSet.rounds` | integer 1 to 50 |
| `ruleSet.roundLengthDays` | integer 1 to 366 |
| `ruleSet.contributionAmount` | amount string in base units |
| `ruleSet.transferPolicy` | exactly `MEMBERS_ONLY` |

Response `201`:

```json
{
  "id": "cir_JYTKGl9r-_ET7GTUNDo-Gg",
  "name": "Ajo",
  "ruleSet": { "…": "as sent" },
  "policyHash": "7272969df90dacd6781c3cfd5c7af0f912ee712bfc686e971f75722540c18f6a",
  "poolId": null,
  "organizerAddress": "GAGCHSTWHAUDETF3L454Z7WDT7H57GYZZWRDO5NJ2EVMFGPLREWKTG23",
  "members": [
    { "address": "GAGCHSTWHAUDETF3L454Z7WDT7H57GYZZWRDO5NJ2EVMFGPLREWKTG23", "role": "ORGANIZER", "joinedAt": "2026-03-01T00:00:00.000Z" }
  ],
  "createdAt": "2026-03-01T00:00:00.000Z",
  "updatedAt": "2026-03-01T00:00:00.000Z"
}
```

`policyHash` is the SHA-256 of the canonical JSON of `ruleSet` (keys sorted, no whitespace). The [code sample](../developers/code-samples.md) reproduces this exact hash. `poolId` stays `null` until the circle is bound to an on-chain pool.

## `GET /v1/circles`

Lists the circles the caller belongs to, as `{ "circles": [ … ] }`.

## `GET /v1/circles/{id}`

Returns one circle. A caller who is not a member gets `404 NOT_FOUND`, not `403`: the existence of a circle is not disclosed.

## `POST /v1/circles/{id}/invitations`

Organizer only. **Needs `Idempotency-Key`.**

```json
{ "label": "bob" }
```

`label` is 1 to 80 characters and is only a note for the organizer. Response `201`:

```json
{
  "invitation": { "id": "inv_q2IBDqefIiIZAnuZ5o1sSA", "label": "bob", "status": "PENDING", "expiresAt": "2026-03-02T00:00:00.000Z" },
  "token": "jpo9SSaAWj4b0BAtX-t7dqAePpajONpkioDPyUMTrKA"
}
```

The `token` is shown **once**. Only its SHA-256 hash is stored. The organizer must pass it to the invitee. An invitation lasts 7 days.

| Status | Code | When |
|---|---|---|
| 403 | `FORBIDDEN` | caller is not the organizer |
| 404 | `NOT_FOUND` | not a member of this circle |
| 422 | `CIRCLE_FULL` | the circle already has `maxMembers` members |

## `POST /v1/invitations/accept`

The invitee, signed in, sends the token:

```json
{ "token": "jpo9SSaAWj4b0BAtX-t7dqAePpajONpkioDPyUMTrKA" }
```

Response `200`: the circle, now listing the invitee with role `MEMBER`.

| Status | Code | When |
|---|---|---|
| 404 | `NOT_FOUND` | no invitation matches the token |
| 409 | `INVITATION_NOT_PENDING` | already accepted |
| 422 | `INVITATION_EXPIRED` | more than 7 days old |
| 409 | `ALREADY_MEMBER` | this user or address is already a member |
| 422 | `CIRCLE_FULL` | the circle filled up in the meantime |

## What circle membership is and is not

Circle membership is off-chain. It lets a user see the circle and request signing for it. **On-chain pool membership is separate**: the controller must call `allow_member` and the member must call `join_pool`. The API has no signing request for those two calls yet. The live Testnet runs did them with `stellar-cli`. An API action that needs on-chain membership (for example `RECIPIENT_NOT_ELIGIBLE` on a transfer) checks the indexer's list of pool members, not the circle.

## Binding a circle to a pool

The organizer creates the on-chain pool with the circle's policy hash as `membership_policy_hash`. The API syncs `pool_created` events from the indexer and sets the circle's `poolId` when it finds one whose hash matches. See [Organizer endpoints](organizer.md).
