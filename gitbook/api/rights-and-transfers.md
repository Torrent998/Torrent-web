# Funding, rights, transfers, claims and leaving

Member-side endpoints. Every `POST` here needs a bearer token and an `Idempotency-Key`, and returns an intent in `AWAITING_SIGNATURE` (see [Intents and signing](intents.md)). All of them first require that the indexer is healthy, so they can return the `503` indexer codes. Sample payloads come from the API example file (synthetic values).

## Funding

### `POST /v1/circles/{id}/funding-intents`

Any circle member. Asks for a signing request for `deposit(pool_id, from, amount)` where `from` is the caller.

```json
{ "amount": "10000000000" }
```

`amount` is a positive integer string in base units. Response `201` is an intent with `kind: "FUNDING"` and descriptor function `deposit` (args `pool_id`, `from`, `amount`). Expected event: `funded`.

| Status | Code | When |
|---|---|---|
| 422 | `POOL_NOT_BOUND` | the circle has no on-chain pool yet |
| 422 | `POOL_NOT_FOUND` | the indexer does not know the pool |
| 409 | `POOL_PAUSED`, `POOL_CLOSED` | the pool is not `Active` |

### `GET /v1/circles/{id}/coverage`

Ledger-derived backing numbers with freshness. Never computed from API data.

```json
{
  "circleId": "cir_JYTKGl9r-_ET7GTUNDo-Gg",
  "bound": true,
  "poolId": "1",
  "totals": { "funded": "10000000000", "reserved": "6000000000", "claimed": "0", "withdrawn": "0" },
  "unreserved": "4000000000",
  "fullyBacked": true,
  "poolStatus": "Active",
  "indexerStatus": "SYNCED",
  "asOfLedger": 1000,
  "lagLedgers": 0,
  "observedAt": "2026-03-01T00:00:00.000Z"
}
```

If the circle is not bound to a pool, the response is just `{ "circleId": "…", "bound": false }`.

A real Testnet coverage result from the organizer run is `{"funded":"3000000","reserved":"2000000","claimed":"0","withdrawn":"0"}` (see [evidence](../evidence/testnet-evidence.md)).

### `GET /v1/circles/{id}/rights`

The payout rights of the circle's pool, from the indexer:

```json
{
  "circleId": "cir_JYTKGl9r-_ET7GTUNDo-Gg",
  "bound": true,
  "indexerStatus": "SYNCED",
  "asOfLedger": 1000,
  "rights": [
    { "rightId": "5", "poolId": "1", "amount": "6000000000", "owner": "GAGCHSTW…KTG23", "maturity": 1772409600,
      "state": "Issued", "pendingTransfer": null, "issuedAtLedger": 2, "claimedAtLedger": null }
  ]
}
```

## Transfers

A transfer takes two signatures in two intents: the owner proposes, the recipient approves.

### `POST /v1/rights/{id}/transfers/intent`

The **current on-chain owner** proposes handing right `{id}` to another member. `{id}` is the chain `rightId`.

```json
{ "toAddress": "GANLDEKIHDICL44ROZQX7HYY57BYB4JSUT32UMZOIZBY3UWZQUNX6MIV", "expiresAt": "2026-03-01T01:00:00.000Z" }
```

Response `201`: `{ "transfer": { … }, "intent": { … } }`. The intent has `kind: "TRANSFER_PROPOSE"` and function `propose_transfer(right_id, new_owner, expiry)` with `expiry` converted to Unix seconds. The `transfer` record:

```json
{
  "id": "trf_Ni1XzZ6e0ANkj3UcVIvMBg",
  "circleId": "cir_JYTKGl9r-_ET7GTUNDo-Gg",
  "rightId": "5",
  "from": "GAGCHSTW…KTG23",
  "to": "GANLDEKI…6MIV",
  "expiresAt": "2026-03-01T01:00:00.000Z",
  "proposeIntentId": "int_cenws0WsLVouGlh4SDmSnQ",
  "acceptIntentId": null,
  "cancelIntentId": null,
  "chainTransferId": null,
  "createdAt": "2026-03-01T00:00:00.000Z"
}
```

The API checks these **before** asking for a signature, mirroring the contract's rules:

| Status | Code | Check |
|---|---|---|
| 403 | `FORBIDDEN` | the caller is not the right's current on-chain owner |
| 404 | `NOT_FOUND` | unknown right, or the caller is not a member of its circle |
| 422 | `RIGHT_NOT_ACTIVE` | already claimed |
| 409 | `POOL_PAUSED`, `POOL_CLOSED` | transfers are disabled |
| 422 | `SAME_OWNER` | recipient is the owner |
| 422 | `RECIPIENT_NOT_ELIGIBLE` | recipient is not in the circle **and** in the on-chain pool |
| 422 | `RIGHT_MATURED` | the right has matured: claim it instead |
| 422 | `INVALID_EXPIRY` | `expiresAt` is not in the future, is more than 30 days away, or is after the right's maturity |
| 409 | `TRANSFER_ALREADY_PENDING` | an unexpired offer is open |

### `POST /v1/transfers/{id}/approve`

The **named recipient** approves. `{id}` is the API transfer id (`trf_…`). No body. Returns `{ transfer, intent }` where the intent is `TRANSFER_ACCEPT` with function `accept_transfer(transfer_id)`. It is only available once the proposal is `CONFIRMED` on-chain.

| Status | Code | When |
|---|---|---|
| 403 | `FORBIDDEN` | the caller is not the named recipient |
| 409 | `PROPOSAL_NOT_CONFIRMED` | the proposal intent is not yet confirmed |
| 409 | `STALE_TRANSFER` | the on-chain offer is not `Pending`, has expired, the right changed owner, or has matured |
| 409 | `POOL_PAUSED`, `POOL_CLOSED` | the pool is not `Active` |

If an accept intent already exists and has not failed, the same one is returned. A stale approval is never reused: the API demands a brand-new proposal instead.

### `POST /v1/transfers/{id}/cancel`

The **proposer** withdraws an on-chain offer. Intent `TRANSFER_CANCEL`, function `cancel_transfer(transfer_id)`. Works while the pool is paused or closed. Errors: `403 FORBIDDEN`, `409 PROPOSAL_NOT_CONFIRMED`, `409 STALE_TRANSFER` (the on-chain offer is no longer `Pending`).

### `POST /v1/transfers/{id}/submit`

Submits the signed transaction for the transfer's **current step**: the cancel intent for the proposer if one is open, the accept intent for the recipient if one is open, otherwise the proposal intent. Body: `{ "signedXdr": "…" }`. Returns `{ "intent": { … } }`. Same checks and errors as `POST /v1/intents/{id}/submit`.

### `GET /v1/circles/{id}/transfers`

```json
{
  "transfers": [
    { "id": "trf_Ni1XzZ6e0ANkj3UcVIvMBg", "rightId": "5", "from": "GAGCHSTW…KTG23", "to": "GANLDEKI…6MIV",
      "expiresAt": "2026-03-01T01:00:00.000Z", "chainTransferId": "77", "status": "ACCEPTING", "…": "…" }
  ]
}
```

`status` is one of `PROPOSING`, `AWAITING_RECIPIENT`, `ACCEPTING`, `COMPLETED`, `CANCELLING`, `CANCELLED`, `FAILED`. The API derives it from the intents. The chain is the source of truth for ownership.

## Claiming

### `POST /v1/rights/{id}/claim-intent`

The current on-chain owner asks to claim. No body. Intent `CLAIM`, function `claim(right_id, recipient)` with `recipient` set to the caller. Expected event: `right_claimed`.

| Status | Code | When |
|---|---|---|
| 403 | `FORBIDDEN` | not the owner |
| 422 | `ALREADY_CLAIMED` | already claimed |
| 422 | `NOT_MATURED` | the maturity is still in the future. Advisory: the contract enforces maturity against ledger time. |

## Leaving a pool

### `POST /v1/circles/{id}/leave-intent`

The caller asks to leave the on-chain pool. Body `{}`. Intent `POOL_LEAVE`, function `leave_pool(pool_id, member)`.

| Status | Code | When |
|---|---|---|
| 422 | `NOT_POOL_MEMBER` | the caller is not an on-chain member |
| 422 | `MEMBER_HAS_RIGHTS` | the caller still owns unclaimed rights. The message says how many. |

Leaving ends on-chain eligibility. Off-chain circle membership is kept, as agreement history.

## What this API does not cover yet

* There is **no signing request for `allow_member` or `join_pool`**. Users join the on-chain pool outside the API.
* There is no request for `pause_pool`, `unpause_pool`, `withdraw_unreserved`, controller rotation or the admin and upgrade functions. Those are done directly against the contract.
* Transfer and claim intents are covered by unit tests. They were not run live on Testnet.
