# Lifecycle of a pool

A pool has three statuses: `Active`, `Paused` and `Closed`.

```
            pause_pool                close_pool
  Active ─────────────► Paused ─────────────────────┐
     ▲  ◄───────────────   │                         ▼
     │     unpause_pool    │ close_pool            Closed (terminal)
     └──── close_pool ─────┴──────────────────────►
```

| Transition | Function | Who signs | Errors |
|---|---|---|---|
| `Active` to `Paused` | `pause_pool` | controller | `AlreadyPaused` (#25), `PoolClosed` (#27) |
| `Paused` to `Active` | `unpause_pool` | controller | `NotPaused` (#26) |
| `Active` or `Paused` to `Closed` | `close_pool` | controller | `AlreadyClosed` (#28) |

`Closed` is terminal. A pool is **settled** when it is closed and `funded - claimed - withdrawn == 0`. That is derived from the totals, not stored.

## What each status allows

| Operation | Active | Paused | Closed |
|---|---|---|---|
| `allow_member`, `remove_member` (before first deposit) | yes | no | no |
| `join_pool` | yes | no | no |
| `deposit` | yes | no | no |
| `issue_right` | yes | no | no |
| `propose_transfer`, `accept_transfer` | yes | no | no |
| `cancel_transfer` | yes | yes | yes |
| `claim` | yes | yes | yes |
| `withdraw_unreserved` | yes | **no** | yes |
| `leave_pool` | yes | yes | yes |
| `propose_controller`, `accept_controller` | yes | yes | yes |
| `pause_pool` | yes | no | no |
| `unpause_pool` | no | yes | no |
| `close_pool` | yes | yes | no |

Two rules sit behind the table:

* **Claims and exits are never blocked.** A claim works in every status. So does leaving a pool and withdrawing an open transfer offer. Pausing or closing cannot trap money that backs a right.
* **Withdrawing unreserved money is blocked only while paused.** Pausing is meant for incidents. Letting the controller pull funds during one would defeat the point. The controller can still only take unreserved money.

## Membership timing

* `allow_member` and `remove_member` work only before the first deposit. Once `funded > 0`, they fail with `MembershipFrozen` (#24). Rules cannot change unilaterally once value is escrowed.
* After funding, membership changes only by the member's own `leave_pool` signature. It fails with `MemberHasRights` (#29) while the member owns an unclaimed right. Their earlier deposits stay in the pool.

## Rotating the controller

Controller rotation takes two steps so a typo cannot hand a pool to an address nobody holds.

1. The current controller calls `propose_controller(pool_id, proposed)`. Event: `controller_proposed`.
2. The named account calls `accept_controller(pool_id)`. Event: `controller_changed`.

Proposing yourself fails with `SameOwner` (#15). Accepting without a proposal fails with `NoPendingController` (#30). The Testnet run in the [evidence](../evidence/testnet-evidence.md) rotated pool 8's controller this way before closing it.
