# Function reference

All 35 public functions of `torrent-escrow` ABI v2, taken from `contracts/escrow/src/lib.rs` and checked against `bindings/abi.v2.json`. Types: `u64` ids and Unix seconds, `i128` amounts in base units, `Address` for accounts and contracts, `BytesN<32>` for hashes.

Error codes link to [Errors](errors.md). "Signer" is the account on which the contract calls `require_auth()`.

## Setup

### `__constructor(admin: Address)`

Runs once at deployment. Stores the contract admin. The admin can only rotate itself and manage upgrades. It emits no event (see [Security](../security/security.md) for what that means for indexers).

### `abi_version() -> u32`

Returns `2`. Callers use it to refuse a contract with a different interface.

## Pools

### `create_pool(controller, token, membership_policy_hash) -> u64`

| | |
|---|---|
| Signer | `controller` |
| Effect | new pool with status `Active`, zero totals, `start_ledger` set to the current ledger. Returns the new `pool_id`. |
| Event | `pool_created` |
| Fails | none of its own |

### `pause_pool(pool_id)` · `unpause_pool(pool_id)` · `close_pool(pool_id)`

| | |
|---|---|
| Signer | the pool's controller |
| Effect | status changes as in [Lifecycle of a pool](../concepts/pool-lifecycle.md) |
| Events | `pool_paused`, `pool_unpaused`, `pool_closed` |
| Fails | `PoolNotFound` (1), `AlreadyPaused` (25), `PoolClosed` (27), `NotPaused` (26), `AlreadyClosed` (28) |

## Members

### `allow_member(pool_id, member)`

| | |
|---|---|
| Signer | controller |
| Effect | adds `member` to the allow-list |
| Event | none |
| Fails | `PoolNotFound`, `PoolPaused` (9), `PoolClosed` (27), `MembershipFrozen` (24, after the first deposit) |

### `join_pool(pool_id, member, signed_policy_hash)`

| | |
|---|---|
| Signer | `member` |
| Effect | creates a `Member` record with `eligible = true` and `open_rights = 0` |
| Event | `member_joined` |
| Fails | `PolicyMismatch` (7, hash differs from the pool's), `NotAllowed` (4, not on the allow-list), `AlreadyMember` (6), plus pool status errors |

### `remove_member(pool_id, member)`

| | |
|---|---|
| Signer | controller |
| Effect | removes the allow-list entry and any member record. Only before the first deposit. |
| Event | `member_removed` |
| Fails | `MembershipFrozen` (24), `NotAllowed` (4, nothing to remove), pool status errors |

### `leave_pool(pool_id, member)`

| | |
|---|---|
| Signer | `member` |
| Effect | sets `eligible = false` and removes the allow-list entry. Past deposits stay in the pool. Works in every pool status. |
| Event | `member_left` |
| Fails | `NotMember` (5), `MemberHasRights` (29, still owns an unclaimed right) |

## Money in

### `deposit(pool_id, from, amount) -> u64`

| | |
|---|---|
| Signer | `from` |
| Allowed `from` | the controller or an eligible member |
| Effect | transfers `amount` of the pool token from `from` to the contract, raises `funded`, returns the new receipt id |
| Event | `funded` |
| Fails | `InvalidAmount` (8, amount not positive), `NotMember` (5), `DepositMismatch` (23, a different amount arrived), `Overflow` (22), pool status errors |

## Rights

### `issue_right(pool_id, owner, amount, maturity, policy_hash) -> u64`

| | |
|---|---|
| Signer | controller |
| Effect | creates a right, raises `reserved` by `amount`, increments the owner's `open_rights`. Returns the new `right_id`. |
| Event | `right_issued` |
| Fails | `InvalidAmount` (8), `MaturityInPast` (11), `NotMember` (5, owner is not eligible), `InsufficientBacking` (10), `Overflow` (22), pool status errors |

### `propose_transfer(right_id, new_owner, expiry) -> u64`

| | |
|---|---|
| Signer | the right's current owner |
| Effect | creates a `Pending` transfer and records it as the right's open offer. Returns the `transfer_id`. An expired earlier offer is cancelled and replaced. |
| Events | `transfer_proposed` (and first `transfer_cancelled` if it replaced an expired offer) |
| Fails | `RightNotFound` (2), `RightNotActive` (14), `SameOwner` (15), `NotMember` (5), `RightMatured` (31), `InvalidExpiry` (16), `TransferPending` (17), pool status errors |

### `cancel_transfer(transfer_id)`

| | |
|---|---|
| Signer | the proposer (`from`) |
| Effect | status `Cancelled`, clears the right's open offer. Works in every pool status. |
| Event | `transfer_cancelled` |
| Fails | `TransferNotFound` (3), `TransferNotPending` (18) |

### `accept_transfer(transfer_id)`

| | |
|---|---|
| Signer | the recipient (`to`) |
| Effect | the right's owner becomes `to`, `open_rights` moves from `from` to `to`, status `Completed` |
| Event | `transfer_completed` |
| Fails | `TransferNotFound` (3), `TransferNotPending` (18), `TransferExpired` (19), `RightNotActive` (14), `RightMatured` (31), `StaleTransfer` (20), `NotMember` (5), pool status errors |

### `claim(right_id, recipient)`

| | |
|---|---|
| Signer | the right's owner |
| Effect | `reserved -= amount`, `claimed += amount`. Voids any open offer, marks the right `Claimed`, decrements `open_rights`, then transfers `amount` to `recipient`. Works in every pool status. |
| Events | `right_claimed` (and first `transfer_cancelled` if an offer was open) |
| Fails | `RightNotFound` (2), `AlreadyClaimed` (13), `NotMatured` (12) |

## Money out

### `withdraw_unreserved(pool_id, to, amount)`

| | |
|---|---|
| Signer | controller |
| Effect | raises `withdrawn` and sends `amount` to `to`. Refused if it would eat into reserved value. |
| Event | `unreserved_withdrawn` |
| Fails | `PoolPaused` (9), `InvalidAmount` (8), `InsufficientBacking` (10), `Overflow` (22) |

## Key rotation

### `propose_controller(pool_id, proposed)` · `accept_controller(pool_id)`

Step 1 is signed by the current controller and stores `proposed`. Step 2 is signed by `proposed` and makes it the controller. Errors: `SameOwner` (15, proposing yourself), `NoPendingController` (30). Events: `controller_proposed`, `controller_changed`.

### `propose_admin(proposed)` · `accept_admin()`

Same two-step pattern for the contract admin. Errors: `SameOwner` (15), `NoPendingAdmin` (32). Events: `admin_proposed`, `admin_changed`.

## Upgrades

See [Governance and upgrades](governance.md) for the rules.

| Function | Signer | Effect | Event | Fails |
|---|---|---|---|---|
| `propose_upgrade(wasm_hash) -> u64` | admin | announces a wasm hash. Returns `executable_after` (now plus 604 800 seconds). | `upgrade_proposed` | `UpgradesLocked` (36), `UpgradePending` (33) |
| `cancel_upgrade()` | admin | removes the pending upgrade | `upgrade_cancelled` | `NoPendingUpgrade` (34) |
| `execute_upgrade()` | admin | installs the proposed wasm once the timelock passed | `contract_upgraded` | `UpgradesLocked` (36), `NoPendingUpgrade` (34), `UpgradeNotReady` (35) |
| `lock_upgrades()` | admin | freezes the code forever and cancels any pending upgrade | `upgrade_cancelled` (if one was pending), `upgrades_locked` | `UpgradesLocked` (36) |

## Views

None of these change state or need a signature.

| Function | Returns | Fails |
|---|---|---|
| `get_pool(pool_id)` | `PoolConfig` | `PoolNotFound` |
| `get_totals(pool_id)` | `EscrowTotals` | `PoolNotFound` |
| `get_unreserved(pool_id)` | `i128`: `funded - claimed - withdrawn - reserved` | `PoolNotFound` |
| `get_right(right_id)` | `PayoutRight` | `RightNotFound` |
| `get_transfer(transfer_id)` | `TransferApproval` | `TransferNotFound` |
| `is_member(pool_id, who)` | `bool`: true only for eligible members | none |
| `get_member(pool_id, who)` | `Member`, also for members who left (`eligible = false`) | `PoolNotFound`, `NotMember` |
| `get_pending_controller(pool_id)` | `Option<Address>` | `PoolNotFound` |
| `get_governance()` | `Governance` | none |
| `get_counts()` | `Counts`: highest pool, right and transfer ids so far | none |

## Calling a function from the command line

With `stellar-cli`, using an identity alias from your local keystore (the smoke script does the same):

```bash
stellar contract invoke \
  --id CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG \
  --source-account <your-alias> --network testnet --send=no \
  -- get_totals --pool_id 8
```

`--send=no` simulates without submitting. Drop it for a state-changing call. Contract errors print as `Error(Contract, #N)`; look the number up in [Errors](errors.md).

Real output from the deployed contract (run on 2026-11-07):

```text
$ ... -- get_totals --pool_id 8
{"claimed":"6000000","funded":"10000000","reserved":"0","withdrawn":"4000000"}

$ ... -- get_counts
{"pools":10,"rights":4,"transfers":2}

$ ... -- get_governance
{"admin":"GAE3F3TYRELLL34IM2N74QG3PXWZUYDMCKBTPDWPN7ZNHBVTXWNC7ZNT","pending_admin":null,"pending_upgrade":null,"upgrade_delay_secs":604800,"upgrade_executable_after":0,"upgrades_locked":false}
```

Note that `get_governance` returns the admin address while the indexer's `GET /v1/contract` shows `"admin": null`. The constructor emits no event, so the indexer cannot learn the admin until an admin rotation happens. The contract is the authority.
