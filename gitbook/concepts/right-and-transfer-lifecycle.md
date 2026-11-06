# Lifecycle of a right and a transfer

## A right

A right has two states: `Issued` and `Claimed`.

```
 issue_right                 claim (at or after maturity)
 ───────────► Issued ─────────────────────────────────► Claimed
                │  ▲
                │  │ accept_transfer (owner changes, state stays Issued)
                ▼  │
              (may carry one open transfer offer)
```

* `issue_right` (controller) creates it in `Issued`. It must have a positive amount, a maturity in the future (`MaturityInPast` #11 otherwise) and an owner who is an eligible member (`NotMember` #5).
* While `Issued` and before maturity, it can change owner by a completed transfer.
* `claim` (owner) moves it to `Claimed`. Before maturity it fails with `NotMatured` (#12). A second claim fails with `AlreadyClaimed` (#13).

### Time rules

Time is ledger time in Unix seconds.

| Moment | What is allowed |
|---|---|
| before `maturity` | the right can be traded: propose, accept, cancel |
| at or after `maturity` | the right can be claimed only. `propose_transfer` and `accept_transfer` fail with `RightMatured` (#31) |

## A transfer

A transfer has three statuses: `Pending`, `Completed` and `Cancelled`.

```
 propose_transfer ──► Pending ──► Completed   (accept_transfer, recipient signs)
                        │
                        └──────► Cancelled    (cancel_transfer, replaced offer, or claim)
```

### Proposing

`propose_transfer(right_id, new_owner, expiry)` is signed by the current owner. It fails when:

| Condition | Error |
|---|---|
| the right is not `Issued` | `RightNotActive` (#14) |
| `new_owner` is the current owner | `SameOwner` (#15) |
| `new_owner` is not an eligible member | `NotMember` (#5) |
| the right has matured | `RightMatured` (#31) |
| `expiry <= now` or `expiry > maturity` | `InvalidExpiry` (#16) |
| an unexpired open offer exists | `TransferPending` (#17) |
| the pool is not `Active` | `PoolPaused` (#9) or `PoolClosed` (#27) |

If an earlier offer has **expired**, a new proposal replaces it. The old one is marked `Cancelled` and a `transfer_cancelled` event is emitted first.

### Accepting

`accept_transfer(transfer_id)` is signed by the recipient. The transfer id is single-use: after completion the status is `Completed`, so a replay fails with `TransferNotPending` (#18). The contract also checks:

| Condition | Error |
|---|---|
| offer already expired (`expiry <= now`) | `TransferExpired` (#19) |
| right matured in the meantime | `RightMatured` (#31) |
| the owner changed or the offer is no longer the right's open offer | `StaleTransfer` (#20) |
| recipient is no longer an eligible member | `NotMember` (#5) |

On success the right's owner becomes the recipient, `open_rights` counts move from the old owner to the new owner, and `transfer_completed` is emitted.

### Cancelling

`cancel_transfer(transfer_id)` is signed by the proposer, allowed in every pool status. It fails with `TransferNotPending` if the offer is not open. Event: `transfer_cancelled`.

### Voided by a claim

If the right has an open offer when it is claimed, the claim voids the offer first. `transfer_cancelled` is emitted before `right_claimed` in the same transaction.

## The two-signature rule

A transfer always needs two different accounts to sign two different transactions. The proposer cannot accept on the recipient's behalf. An old owner cannot claim a right after it moved. The tests cover both (`old_owner_real_auth_rejected`, `transfer_calls_demand_the_right_signers`).

## The API's view of a transfer

The API tracks the workflow around the on-chain transfer with its own status.

| API `status` | Meaning |
|---|---|
| `PROPOSING` | proposal intent exists, not yet confirmed on-chain |
| `AWAITING_RECIPIENT` | proposal confirmed; the recipient has not approved |
| `ACCEPTING` | accept intent in flight |
| `COMPLETED` | accept confirmed |
| `CANCELLING` | cancel intent in flight |
| `CANCELLED` | cancel confirmed |
| `FAILED` | proposal intent failed |

The chain remains the source of truth for ownership. See [Rights and transfers](../api/rights-and-transfers.md).
