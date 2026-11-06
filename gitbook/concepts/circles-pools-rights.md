# Circles, pools and rights

Three objects carry the whole system. Two live on-chain, one lives in the API.

```
 off-chain (torrent-api)          on-chain (torrent-escrow)
┌──────────────────────┐         ┌──────────────────────────────────────┐
│ Circle               │  binds  │ Pool  (pool_id)                      │
│  name, rule set      │ ──────► │  controller, token, policy hash,     │
│  policy hash         │ by hash │  status, totals                      │
│  members, invitations│         │   ├── Member (allowed, joined)       │
└──────────────────────┘         │   └── Payout right (right_id)        │
                                 │        owner, amount, maturity,     │
                                 │        pending transfer              │
                                 └──────────────────────────────────────┘
```

## Circle (API)

A circle holds the human agreement: a name and a rule set, plus the list of members and invitations. It has a policy hash and, once bound, a `poolId`. The organizer creates it, and invites members with single-use tokens. The circle is a convenience layer. It cannot move money.

## Pool (contract)

A pool is created by `create_pool(controller, token, membership_policy_hash)`. Its stored configuration is:

| Field | Type | Meaning |
|---|---|---|
| `pool_id` | u64 | Counter-assigned id, starting at 1. |
| `controller` | address | Who runs the pool. |
| `token` | address | The one token this pool holds. |
| `membership_policy_hash` | bytes32 | Hash of the agreed rules. Never changes. |
| `start_ledger` | u32 | Ledger when the pool was created. |
| `status` | `Active`, `Paused`, `Closed` | See [Lifecycle of a pool](pool-lifecycle.md). |

Each pool also has `EscrowTotals` (`funded`, `reserved`, `claimed`, `withdrawn`), a receipt counter for deposits, an allow-list and member records. Pools are isolated from each other. The tests check that one pool's operations never change another pool's totals.

## Payout right (contract)

A right is created by `issue_right`. Its stored fields:

| Field | Type | Meaning |
|---|---|---|
| `right_id` | u64 | Counter-assigned id, global across pools. |
| `pool_id` | u64 | The pool that backs it. |
| `amount` | i128 | Base units reserved for it. |
| `owner` | address | Who may claim or transfer it. |
| `maturity` | u64 | Unix seconds when it unlocks. |
| `transfer_policy_hash` | bytes32 | Opaque data stored for the app. The contract does not interpret it. |
| `state` | `Issued`, `Claimed` | |
| `pending_transfer` | optional u64 | At most one open offer per right. |

## One token per pool

A pool holds a single token. The contract fails closed on tokens that move a different amount than requested (`DepositMismatch`), so fee-on-transfer and rebasing tokens are refused.

## Ids

Pool, right and transfer ids are counters kept in contract storage: the highest id handed out so far, `0` meaning none. They are opaque to clients. `get_counts` returns all three so the indexer can check it has seen every object.
