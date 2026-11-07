# Contract overview and storage

`torrent-escrow` is a single Soroban contract that hosts many pools. It is written in Rust with `soroban-sdk` 29.0.1 as a `no_std` crate. The public interface is called **ABI v2**. ABI v1 was never deployed, so v2 replaced it outright.

| Property | Value |
|---|---|
| Crate | `contracts/escrow` in [Torrent-contracts](https://github.com/Torrent998/Torrent-contracts) |
| ABI version | `2` (`abi_version()` returns it) |
| Public functions | 35, listed in [Function reference](functions.md) |
| Errors | 36 codes, see [Errors](errors.md) |
| Events | 22 kinds, see [Events](events.md) |
| Testnet deployment | `CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG` |
| Wasm sha256 | `9dd206c4b7e4f673dd6006da9c45efe3d8b0ad5e1155d8e3b957f855f330f264` |
| Status | Testnet only. Not audited. |

## Design decisions

These come from two architecture decision records in the repo.

* **One contract, many pools** (ADR 0001). Pools are keyed by `pool_id`. Rights and transfers have global counters.
* **One invariant in one place** (ADR 0001). `reserved <= funded - claimed - withdrawn` is checked inside `save_totals`, the only function that writes totals. See [The backing invariant](../concepts/backing-invariant.md).
* **Checks, effects, then interaction.** `claim` and `withdraw_unreserved` update storage before moving tokens.
* **Fail closed on tokens.** `deposit` compares the contract's token balance before and after. A different amount arriving is `DepositMismatch`.
* **Consent over convenience** (ADR 0002). After the first deposit the controller cannot change membership. Only the member can leave.
* **Two-step rotation** for the pool controller and for the contract admin.
* **Everything is evented** (ADR 0002). No state change is silent, so an indexer can rebuild the full state.
* **No nonce table.** Soroban authorization already binds each signature to an invocation, a host-checked nonce and an expiration ledger. On top of that, application objects are single use: a transfer id completes or cancels once, and a right is claimed once.

## Storage

The contract uses two kinds of Soroban storage.

**Instance storage** (one entry, shared by the whole contract):

| Key | Value |
|---|---|
| `PoolCount`, `RightCount`, `TransferCount` | highest id handed out so far (`0` means none) |
| `Admin` | contract admin address, set by the constructor |
| `PendingAdmin` | proposed new admin, if any |
| `PendingUpgrade` | proposed wasm hash with `proposed_at` and `executable_after` |
| `UpgradesLocked` | `true` once `lock_upgrades` ran |

**Persistent storage** (one entry per object):

| Key | Value |
|---|---|
| `Pool(pool_id)` | `PoolConfig` |
| `Totals(pool_id)` | `EscrowTotals` (`funded`, `reserved`, `claimed`, `withdrawn`) |
| `Receipts(pool_id)` | deposit receipt counter |
| `Allowed(pool_id, address)` | `true` if the controller allowed this address |
| `Member(pool_id, address)` | `Member` record |
| `Right(right_id)` | `PayoutRight` |
| `Transfer(transfer_id)` | `TransferApproval` |
| `PendingController(pool_id)` | proposed successor controller |

### Time to live

Soroban entries expire unless their TTL is extended. The contract extends on every read and write:

| Constant | Value |
|---|---|
| `DAY_IN_LEDGERS` | 17 280 |
| `TTL_THRESHOLD` | 30 days of ledgers (518 400) |
| `TTL_EXTEND_TO` | 60 days of ledgers (1 036 800) |

When an entry's remaining TTL drops below the threshold, it is extended to 60 days. An object nobody touches for longer than that can expire. This is a known limit of the prototype: there is no keeper that extends idle pools.

## Public types

```rust
pub enum PoolStatus { Active, Paused, Closed }

pub struct PoolConfig {
    pub pool_id: u64, pub controller: Address, pub token: Address,
    pub membership_policy_hash: BytesN<32>, pub start_ledger: u32, pub status: PoolStatus,
}
pub struct EscrowTotals { pub funded: i128, pub reserved: i128, pub claimed: i128, pub withdrawn: i128 }
pub struct Member {
    pub pool_id: u64, pub address: Address, pub eligible: bool, pub joined_at: u64,
    pub signed_policy_hash: BytesN<32>, pub open_rights: u32,
}
pub enum RightState { Issued, Claimed }
pub struct PayoutRight {
    pub right_id: u64, pub pool_id: u64, pub amount: i128, pub owner: Address, pub maturity: u64,
    pub transfer_policy_hash: BytesN<32>, pub state: RightState, pub pending_transfer: Option<u64>,
}
pub enum TransferStatus { Pending, Completed, Cancelled }
pub struct TransferApproval {
    pub transfer_id: u64, pub right_id: u64, pub from: Address, pub to: Address,
    pub expiry: u64, pub status: TransferStatus,
}
pub struct Governance {
    pub admin: Address, pub pending_admin: Option<Address>, pub pending_upgrade: Option<BytesN<32>>,
    pub upgrade_executable_after: u64, pub upgrades_locked: bool, pub upgrade_delay_secs: u64,
}
pub struct Counts { pub pools: u64, pub rights: u64, pub transfers: u64 }
```

`Member.open_rights` counts the unclaimed rights a member owns. It changes on issue, accept and claim. A property test checks that it always equals the real number.
