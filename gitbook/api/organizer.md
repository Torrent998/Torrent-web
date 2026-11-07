# Organizer endpoints

Three endpoints ask for the signing requests only the organizer (the circle's organizer, who must also be the pool's on-chain controller) can use. All need a bearer token and an `Idempotency-Key`. All return `201` with `{ "intent": { … } }` in `AWAITING_SIGNATURE`.

They follow the same contract as every other intent: the API verifies preconditions against indexer truth, returns an unsigned descriptor, the organizer's wallet signs, and nothing counts as done until the indexer shows the event for that transaction hash.

## `POST /v1/circles/{id}/pool-intent`

Creates the on-chain pool for the circle. Body `{}`. The descriptor is:

```text
create_pool(
  controller              = the organizer's address,
  token                   = circle.ruleSet.tokenContractId,
  membership_policy_hash  = circle.policyHash          (bytes32)
)
```

Expected event: `pool_created`. When the indexer reports it, the API **binds** the circle: it finds the `pool_created` event whose `membership_policy_hash` equals the circle's policy hash and stores its pool id as the circle's `poolId`.

| Status | Code | When |
|---|---|---|
| 403 | `FORBIDDEN` | the caller is not the circle's organizer |
| 404 | `NOT_FOUND` | not a member of the circle |
| 409 | `POOL_ALREADY_BOUND` | the circle already has a pool |

## `POST /v1/circles/{id}/rights-intent`

Issues a payout right to a pool member.

```json
{ "owner": "GANLDEKIHDICL44ROZQX7HYY57BYB4JSUT32UMZOIZBY3UWZQUNX6MIV", "amount": "2000000", "maturity": 1793811090 }
```

| Field | Rule |
|---|---|
| `owner` | account or contract address (56 characters). Must be in the pool's on-chain member list. |
| `amount` | positive integer string in base units |
| `maturity` | positive integer, Unix seconds, in the future |

The descriptor is `issue_right(pool_id, owner, amount, maturity, policy_hash)` with the circle's policy hash. Expected event: `right_issued`.

The API refuses an **unbacked** issue up front, so nobody signs a doomed transaction. It computes `free = funded - reserved - claimed - withdrawn` from the indexer and refuses when `amount > free`:

| Status | Code | When |
|---|---|---|
| 403 | `FORBIDDEN` | the caller is not the organizer, or is not the pool's on-chain controller |
| 422 | `POOL_NOT_BOUND`, `POOL_NOT_FOUND` | no pool bound, or the indexer does not know it |
| 409 | `POOL_PAUSED`, `POOL_CLOSED` | the pool is not `Active` |
| 422 | `NOT_POOL_MEMBER` | the owner has not joined the on-chain pool |
| 422 | `MATURITY_IN_PAST` | `maturity` is not in the future |
| 422 | `INSUFFICIENT_BACKING` | `amount` exceeds the unreserved balance. The message names the free amount. |

The contract enforces the same rule on-chain with `InsufficientBacking` (#10). The API check is a courtesy, not the defence.

## `POST /v1/circles/{id}/close-intent`

Closes the pool permanently. Body `{}`. Descriptor `close_pool(pool_id)`. Expected event: `pool_closed`.

| Status | Code | When |
|---|---|---|
| 403 | `FORBIDDEN` | not the organizer or not the on-chain controller |
| 422 | `POOL_NOT_BOUND`, `POOL_NOT_FOUND` | no pool bound or unknown to the indexer |
| 409 | `POOL_CLOSED` | already closed |

Closing never confiscates: issued rights stay claimable and unreserved money stays withdrawable. See [Lifecycle of a pool](../concepts/pool-lifecycle.md).

## Verified live

The organizer flow was run end to end against the Testnet contract on 2026-11-04 (evidence file `deployments/testnet-api-organizer-e2e.json` in Torrent-contracts):

| Step | Result |
|---|---|
| `create_pool` through the API | confirmed, tx [`68ae86c5…`](https://stellar.expert/explorer/testnet/tx/68ae86c526ee6927b215e28640c4e533accd9a5a3e784d452842520e7529ae30), circle bound to pool 10 |
| member allowed and joined | **by `stellar-cli`**, since the API has no request for it |
| `deposit` through the API | confirmed, tx [`b1e5dd5f…`](https://stellar.expert/explorer/testnet/tx/b1e5dd5f7972e6e50de47cc1a6fb6e0277da4e7df4aac49eeb10cebf244978f8) |
| unbacked `issue_right` | refused by the API before signing, `INSUFFICIENT_BACKING` |
| `issue_right` through the API | confirmed, tx [`14db7add…`](https://stellar.expert/explorer/testnet/tx/14db7add74079b76531caa3588ae93a1b60cfc1bf2922b5896d342b1fcae4fb9) |
| `close_pool` through the API | confirmed, tx [`44df9338…`](https://stellar.expert/explorer/testnet/tx/44df9338f0dd965130f66f1549faf0b5f58ea3661ba4eb23b2a0184a50cd4a90) |
| coverage afterwards | `{"funded":"3000000","reserved":"2000000","claimed":"0","withdrawn":"0"}` |

The signatures in this run were made with `stellar-cli` identities, not a browser wallet.
