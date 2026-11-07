# Errors

The contract returns typed errors (`#[contracterror]`). `stellar-cli` and RPC simulation show them as `Error(Contract, #N)`. All 36 codes, from `contracts/escrow/src/types.rs`:

| # | Name | Raised when |
|---|---|---|
| 1 | `PoolNotFound` | the pool id does not exist |
| 2 | `RightNotFound` | the right id does not exist |
| 3 | `TransferNotFound` | the transfer id does not exist |
| 4 | `NotAllowed` | the address is not on the pool's allow-list (`join_pool`), or there is nothing to remove (`remove_member`) |
| 5 | `NotMember` | the address is not an eligible member of the pool |
| 6 | `AlreadyMember` | the address already joined |
| 7 | `PolicyMismatch` | the policy hash a member signed differs from the pool's |
| 8 | `InvalidAmount` | an amount is zero or negative |
| 9 | `PoolPaused` | the pool is paused and the call is not allowed while paused |
| 10 | `InsufficientBacking` | the call would make `reserved > funded - claimed - withdrawn` |
| 11 | `MaturityInPast` | `issue_right` with a maturity at or before now |
| 12 | `NotMatured` | `claim` before the right's maturity |
| 13 | `AlreadyClaimed` | the right was already claimed |
| 14 | `RightNotActive` | the right is not in state `Issued` |
| 15 | `SameOwner` | the new owner, proposed controller or proposed admin equals the current one |
| 16 | `InvalidExpiry` | transfer expiry is not in the future, or is later than the right's maturity |
| 17 | `TransferPending` | the right already has an unexpired open offer |
| 18 | `TransferNotPending` | the transfer is not open (already completed or cancelled) |
| 19 | `TransferExpired` | the offer's expiry has passed |
| 20 | `StaleTransfer` | the right's owner changed since the offer was made, or the offer is no longer the right's open offer |
| 21 | `NotFunded` | reserved in the type; no current code path returns it |
| 22 | `Overflow` | checked arithmetic overflowed |
| 23 | `DepositMismatch` | the token moved a different amount than requested |
| 24 | `MembershipFrozen` | `allow_member` or `remove_member` after the first deposit |
| 25 | `AlreadyPaused` | `pause_pool` on a paused pool |
| 26 | `NotPaused` | `unpause_pool` on a pool that is not paused |
| 27 | `PoolClosed` | the pool is closed and the call is not allowed on closed pools |
| 28 | `AlreadyClosed` | `close_pool` on a closed pool |
| 29 | `MemberHasRights` | `leave_pool` while owning an unclaimed right |
| 30 | `NoPendingController` | `accept_controller` with no proposal |
| 31 | `RightMatured` | trading a right that has matured: it can only be claimed |
| 32 | `NoPendingAdmin` | `accept_admin` with no proposal |
| 33 | `UpgradePending` | `propose_upgrade` while one is already pending |
| 34 | `NoPendingUpgrade` | `cancel_upgrade` or `execute_upgrade` with none pending |
| 35 | `UpgradeNotReady` | `execute_upgrade` before the timelock ends |
| 36 | `UpgradesLocked` | any upgrade call after `lock_upgrades` |

Code `21` (`NotFunded`) is defined but no function returns it today.

## Seven errors seen on Testnet

The smoke run on pool 8 recorded these refusals (see the [worked example](../concepts/worked-example.md)):

| Error | Step |
|---|---|
| #10 `InsufficientBacking` | issue a right one unit larger than the funded balance |
| #16 `InvalidExpiry` | offer that outlives the right's maturity |
| #18 `TransferNotPending` | accept the same transfer twice |
| #12 `NotMatured` | claim before maturity |
| #29 `MemberHasRights` | leave while owning a right |
| #13 `AlreadyClaimed` | claim twice |
| #27 `PoolClosed` | deposit into a closed pool |

## Error codes in other layers

The indexer and API use their own error names. The API maps many contract rules to its own codes so a user is refused before signing. For example `INSUFFICIENT_BACKING`, `MATURITY_IN_PAST` or `RIGHT_MATURED`. Those are listed in [API error codes](../api/errors.md).
