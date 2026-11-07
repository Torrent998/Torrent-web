# Governance and upgrades

There are two separate kinds of authority in the contract. They do not overlap.

| Authority | Scope | Set by |
|---|---|---|
| **Pool controller** | one pool: members, rights, pausing, closing, unreserved withdrawals | `create_pool` |
| **Contract admin** | the contract itself: its own rotation and its code | the constructor |

The admin has **no power over any pool, right or token**. A test (`admin_has_no_power_over_pools`) checks that the admin cannot pause, close, withdraw or issue in any pool.

## Admin rotation

Two steps, so a typo cannot hand control to an address nobody holds.

1. `propose_admin(proposed)`, signed by the current admin. Event `admin_proposed`.
2. `accept_admin()`, signed by `proposed`. Event `admin_changed`.

Errors: `SameOwner` (15) when proposing yourself, `NoPendingAdmin` (32) when accepting with no proposal.

## Upgrade policy

The code can change only through a public, delayed process.

```
propose_upgrade(wasm_hash) ── 7 days (604 800 s) ──► execute_upgrade()
        │                                                  │
        └── cancel_upgrade()                               └── contract_upgraded event, new code live
        
lock_upgrades()  ── irreversible: no more proposals or executions, ever
```

| Step | Function | Rule |
|---|---|---|
| Announce | `propose_upgrade(wasm_hash)` | emits `upgrade_proposed` with `executable_after = now + 604 800`. Only one proposal can be pending (`UpgradePending` #33). |
| Withdraw | `cancel_upgrade()` | emits `upgrade_cancelled`. |
| Install | `execute_upgrade()` | allowed only when `now >= executable_after` (`UpgradeNotReady` #35). Emits `contract_upgraded`, then installs the wasm. Storage (pools, rights, totals) is kept. The constructor does not run again. |
| Freeze | `lock_upgrades()` | cancels any pending upgrade and sets `UpgradesLocked`. After that every upgrade call fails with `UpgradesLocked` (#36). |

All of these need the admin's signature. `get_governance()` shows the current state:

```json
{
  "admin": "GAE3F3TYRELLL34IM2N74QG3PXWZUYDMCKBTPDWPN7ZNHBVTXWNC7ZNT",
  "pending_admin": null,
  "pending_upgrade": null,
  "upgrade_delay_secs": 604800,
  "upgrade_executable_after": 0,
  "upgrades_locked": false
}
```

That is the real output of the deployed Testnet contract on 2026-11-07.

## What the delay is for, and what it is not

The week gives members and the indexer time to see an upgrade coming and to claim or leave. The web app shows a disclosure banner when the indexer reports a pending upgrade.

It is **disclosure, not protection**. If the admin proposes malicious code and nobody reacts within seven days, the code can be installed. This is why an unaudited prototype must not hold real funds, and why `lock_upgrades` exists for a future audited release.

## Who is the Testnet admin?

The deploy script uses the deployer as admin unless `TORRENT_ADMIN_ADDRESS` is set. On Testnet the admin is `GAE3F3TYRELLL34IM2N74QG3PXWZUYDMCKBTPDWPN7ZNHBVTXWNC7ZNT`, the throwaway `torrent-deployer` identity. Nothing has been rotated or upgraded.

## How the tests cover it

`tests/governance.rs` has seven tests: the constructor sets the admin and defaults, admin rotation is two-step, admin calls need the admin signature, an upgrade is timelocked and preserves state (it upgrades to this crate's own release wasm), a cancelled upgrade cannot execute, locking is permanent and cancels a pending upgrade, and the admin has no power over pools.
