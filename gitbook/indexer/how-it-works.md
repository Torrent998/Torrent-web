# How the indexer works

`torrent-indexer` reads the escrow contract's events from Soroban RPC, rebuilds the state of every pool, right and transfer, and serves it through a small read-only HTTP API. It needs no keys. It only reads public chain data.

Source: [Torrent-indexer](https://github.com/Torrent998/Torrent-indexer).

```
 Soroban RPC ──getEvents / getLedgers──►  Indexer  ──► SQLite (events, checkpoints, faults)
      ▲                                      │
      │  get_totals / get_right / ...        ├──► Projection (pools, rights, transfers, governance)
      └──────── reconcile ◄──────────────────┘                   │
                                                                  ▼
                                                      GET /v1/*  (read-only JSON)
```

## The loop

Every `POLL_MS` (5 seconds by default) the indexer does one *tick*:

1. **Reorg check.** It compares the ledger hashes it stored (checkpoints) with the network's. If a stored hash changed, it rolls back to the last common ledger and counts a reorg.
2. **Fetch a page** of events for the one contract id, starting from the stored cursor. A fresh indexer starts at `CHAIN_START_LEDGER`.
3. **Ingest each event.** It skips events from other contracts and events not from a successful call. It decodes the event against the ABI v2 table, drops exact duplicates, and applies the event to the projection.
4. **Checkpoint** the ledger hash and **save** everything in one SQLite transaction together with the cursor.

If a page was full, the next tick starts immediately. Otherwise it sleeps. After an error it backs off, doubling from 1 second up to 60 seconds.

Every `RECONCILE_EVERY_TICKS` ticks (60 by default), when status is `SYNCED`, it also runs [reconciliation](reconciliation.md).

## Guarantees

| Guarantee | How |
|---|---|
| **Idempotent** | An event id seen again with the same content is dropped. The same id with different content halts the indexer (`INTEGRITY_CONFLICT`). |
| **Durable** | State is saved after every page. A restart resumes from the stored cursor. The cursor is committed in the same transaction as the events, so it can never run ahead of them. |
| **Deterministic** | The projection is a pure function of the stored event log. Replaying the log from scratch gives an identical read model. |
| **Fail closed** | Wrong network, unknown schema, an event that does not fit the state, a reorg that is too deep, or a reconciliation mismatch each record a fault and stop the indexer from advancing. |

## Network safety

Every event carries `network_id` (the SHA-256 of the network passphrase). The decoder compares it with the configured network and halts with `NETWORK_MISMATCH` on a difference. On startup, if the stored state belongs to a different network or contract than the configuration, the process refuses to start instead of mixing networks. `STELLAR_NETWORK` must be `testnet` unless `ALLOW_NON_TESTNET=1` is set.

## Finality

Each event is reported with a `finality` of `CONFIRMED` or `SUBMITTED`. An event is `CONFIRMED` once the latest observed ledger is at least `CONFIRMATIONS` ledgers past the event's ledger (1 by default). The API only acts on `CONFIRMED` events.

## Status

`GET /v1/status` reports one of:

| Status | Meaning |
|---|---|
| `SYNCING` | scanned ledger is behind the latest observed ledger |
| `SYNCED` | caught up |
| `RECONCILING` | at least one fault is recorded. The indexer is halted and does not advance. |

## Storage

SQLite (`node:sqlite`, WAL, `synchronous = FULL`) with four tables: `events` (one row per event), `checkpoints` (ledger hashes for reorg detection, at most 256 kept), `faults` and `meta`. A reorg rollback deletes only the dropped rows. `node:sqlite` is experimental in Node 22.

## An operational limit to know about

Soroban RPC keeps only a limited window of event history. The indexer can rebuild from `CHAIN_START_LEDGER` only while that ledger is still inside the RPC provider's window. On the hosted free Render plan the database resets whenever the service restarts, so a restart forces a full backfill. If the contract is older than the RPC window, that backfill is incomplete. A production setup needs a persistent disk and, for long-lived contracts, an archive source of ledger metadata. Neither exists yet. See [Roadmap and known gaps](../project/roadmap.md).

## What the indexer is not

* It is not a source of truth. The contract is. The indexer is checked against it.
* It does not write to the chain, hold keys or sign anything.
* It does not serve authenticated data. The API does that, restricted to a user's own circles.
