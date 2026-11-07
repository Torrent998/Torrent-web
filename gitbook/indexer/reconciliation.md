# Reconciliation and faults

An indexer can be wrong. It might miss an event, decode one badly or be fed bad data. Reconciliation catches that by comparing the indexer's rebuilt state with the contract's own getters. On any difference the indexer halts instead of trusting either side.

## What is compared

`Indexer.reconcile(reader)` runs through a `ChainStateReader`, which calls the contract's view functions by Soroban simulation.

| Compared | Contract getter | Mismatch message starts with |
|---|---|---|
| each pool's `funded`, `reserved`, `claimed`, `withdrawn` | `get_totals` | `pool <id> funded: chain … != indexed …` |
| each right's owner and whether it is claimed | `get_right` | `right <id> owner: …` and `right <id> claimed flag differs from chain` |
| each pool's status and controller | `get_pool` | `pool <id> status: …`, `pool <id> controller: …` |
| `upgradesLocked` | `get_governance` | `upgradesLocked: …` |
| pending upgrade hash | `get_governance` | `pending upgrade: …` |
| admin | `get_governance` | `admin: …`, **only if an admin event was seen** |

The admin check is skipped while the indexed admin is `null`. The constructor emits no event, so there is nothing to compare until the first rotation.

## When it runs

Every `RECONCILE_EVERY_TICKS` ticks (default 60, about every five minutes at the default poll interval), only while status is `SYNCED`.

## Faults

A fault is a recorded reason the indexer stopped. Any fault changes the status to `RECONCILING`, and the indexer stops advancing until an operator intervenes. Faults are persisted, so a halted indexer stays halted after a restart.

| Code | Meaning |
|---|---|
| `NETWORK_MISMATCH` | an event's `network_id` is not the configured network |
| `SCHEMA_MISMATCH` | an event does not match the ABI v2 shape |
| `UNKNOWN_EVENT` | an event name that is not in the ABI v2 table |
| `BAD_EVENT_ID` | an event id that is not in the `<19 digits>-<10 digits>` form |
| `INTEGRITY_CONFLICT` | the same event id arrived again with different content |
| `OUT_OF_ORDER` | an event that sorts before the cursor but was never seen |
| `PROJECTION_INCONSISTENT` | an event cannot be applied to the current state, or the stored log no longer replays |
| `REORG_TOO_DEEP` | ledger hashes changed and no stored checkpoint matches |
| `RECONCILIATION_MISMATCH` | the projection differs from the contract (see above) |

Each fault has `code`, `message` and `at`, and sometimes `eventId`. They appear in `GET /v1/status` under `faults`.

## What the API does when the indexer is halted

The API refuses every sensitive action with `INDEXER_HALTED` (HTTP 503) while the indexer is `RECONCILING`. It refuses with `INDEXER_STALE` when the indexer is more than `MAX_INDEXER_LAG_LEDGERS` (10 by default) behind, and with `NETWORK_MISMATCH` when it serves another network. Nobody is asked to sign a call the API cannot verify.

## Recovering

The recovery steps are deliberate and manual:

1. Read the fault in `GET /v1/status`.
2. Decide whether the chain or the indexer is wrong. The contract's getters are authoritative.
3. If the indexer's data is bad, call `resetForReplay()`. It discards all indexed data. The indexer then backfills from `CHAIN_START_LEDGER`. After catch-up, the projection must equal the previous one if the chain did not diverge.
4. Restart the indexer.

In the hosted setup there is no operator console. Deleting the SQLite file and restarting the service has the same effect. Remember the retention caveat on [How the indexer works](how-it-works.md): a replay needs the start ledger to still be inside the RPC provider's history window.

## Reorgs

A reorg is not a fault. The indexer keeps up to 256 ledger checkpoints (ledger number and hash). Each tick it walks them from newest to oldest. If it finds a stored hash that no longer matches, it looks for the newest checkpoint that still matches, rolls back events after that ledger, and counts a reorg (`reorgCount` in the status). Only when no stored checkpoint matches does it raise `REORG_TOO_DEEP`. Ledgers the RPC cannot vouch for (outside its window) are skipped, not treated as changed.

## What has and has not been exercised

Unit tests cover the decoder, projection, restart durability, reorg rollback, fail-closed behaviour and reconciliation with a fake ledger source (78 tests). The hosted indexer has run live against Testnet and reported `SYNCED` with 54 events. A forced reconciliation mismatch was not provoked on the live network, so that path is covered by the unit tests only.
