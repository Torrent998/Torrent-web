# Indexer HTTP API

The indexer serves a read-only JSON API. Any method other than `GET` returns `405`. There is no authentication: it exposes public chain data only. Every response carries `x-request-id` and `cache-control: no-store`.

Hosted instance: <https://torrent-indexer.onrender.com>. All samples below are real responses from it.

## Errors

```json
{ "error": { "code": "NOT_FOUND", "message": "pool not found", "requestId": "…" } }
```

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_QUERY` | bad `cursor` or `limit` on `/v1/ledger/events` |
| 404 | `NOT_FOUND` | unknown pool, right or transfer, or no such route |
| 405 | `METHOD_NOT_ALLOWED` | not a `GET` |
| 500 | `INTERNAL` | unexpected failure |

## `GET /healthz`

Liveness check.

```json
{ "ok": true }
```

## `GET /v1/status`

```json
{
  "schemaVersion": 1,
  "network": "testnet",
  "contractId": "CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG",
  "status": "SYNCED",
  "cursor": "0023869963647356928-0000000000",
  "scannedThrough": 5585871,
  "latestObservedLedger": 5585871,
  "lagLedgers": 0,
  "eventCount": 54,
  "reorgCount": 0,
  "confirmations": 1,
  "faults": []
}
```

`lagLedgers` is `latestObservedLedger - scannedThrough`. `faults` lists recorded faults, each with `code`, `message`, `at` and sometimes `eventId`.

## `GET /v1/contract`

Governance derived from events.

```json
{
  "contractId": "CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG",
  "abiVersion": 2,
  "admin": null,
  "pendingAdmin": null,
  "pendingUpgrade": null,
  "upgradesLocked": false,
  "upgrades": [],
  "indexerStatus": "SYNCED",
  "latestObservedLedger": 5585874
}
```

`admin` is `null` until an `admin_changed` event is seen, because the constructor emits no event. The contract's `get_governance` is authoritative.

## `GET /v1/ledger/events`

Query parameters:

| Name | Rule | Default |
|---|---|---|
| `cursor` | an event id such as `0023867627185131520-0000000000`. Returns events after it. | start |
| `limit` | integer 1 to 200 | 50 |

Response:

```json
{
  "schemaVersion": 1,
  "network": "testnet",
  "events": [ { "id": "…", "ledger": 5557115, "name": "right_issued", "refs": { "poolId": "5", "rightId": "1" }, "data": { "…": "…" }, "finality": "CONFIRMED", "reconciliation": { "…": "…" } } ],
  "nextCursor": "0023869963647356928-0000000000",
  "indexerStatus": "SYNCED"
}
```

Each event has `id`, `ledger`, `ledgerClosedAt`, `txHash`, `contractId`, `name` (for example `right_issued`), `refs` (`poolId`, `rightId`, `transferId` as strings, where they apply), `data` (decoded fields as strings), `finality` and a `reconciliation` block:

```json
{
  "id": "torrent-indexer:0023867627185131520-0000000000",
  "sourceRepo": "torrent-indexer",
  "schemaVersion": 1,
  "network": "testnet",
  "ledgerCursor": "0023867627185131520-0000000000",
  "entityRef": "right:1",
  "status": "CONFIRMED",
  "observedAt": "2026-11-06T08:16:37.328Z"
}
```

`entityRef` is `transfer:<id>`, `right:<id>`, `pool:<id>` or, for contract-level events, `contract:<contractId>`.

Page through with `nextCursor` until `events` is empty.

## `GET /v1/pools/{id}`

```json
{
  "poolId": "8",
  "controller": "GBFNGRIYGVD5K7VNVNYLOZLGGU4VYTUJBK7CCOCEWQ5T57WUMXCMQ3HE",
  "token": "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  "membershipPolicyHash": "0707070707070707070707070707070707070707070707070707070707070707",
  "startLedger": 5557390,
  "status": "Closed",
  "members": ["GBFNGRIYGVD5K7VNVNYLOZLGGU4VYTUJBK7CCOCEWQ5T57WUMXCMQ3HE"],
  "departedMembers": ["GANJJAOOXXB7IBSKRQ56GFTZIF73M5WFPXCAHRDRJYJLDDSQORINWZ2O"],
  "pendingController": null,
  "receipts": 1,
  "totals": { "funded": "10000000", "reserved": "0", "claimed": "6000000", "withdrawn": "4000000" },
  "createdAtLedger": 5557390,
  "coverage": { "unreserved": "0", "fullyBacked": true },
  "indexerStatus": "SYNCED",
  "latestObservedLedger": 5585874
}
```

`coverage.unreserved` is `funded - claimed - withdrawn - reserved`. `fullyBacked` is true when it is not negative.

## `GET /v1/pools/{id}/rights`

```json
{
  "rights": [
    {
      "rightId": "3",
      "poolId": "8",
      "amount": "6000000",
      "owner": "GANJJAOOXXB7IBSKRQ56GFTZIF73M5WFPXCAHRDRJYJLDDSQORINWZ2O",
      "maturity": 1793811090,
      "state": "Claimed",
      "pendingTransfer": null,
      "issuedAtLedger": 5557433,
      "claimedAtLedger": 5557517
    }
  ],
  "indexerStatus": "SYNCED",
  "latestObservedLedger": 5585874
}
```

## `GET /v1/rights/{id}` and `GET /v1/transfers/{id}`

Return one right (same fields as in the list above) or one transfer. Both add `indexerStatus` and `latestObservedLedger`. A real transfer (the one in the [worked example](../concepts/worked-example.md)):

```json
{
  "transferId": "2",
  "rightId": "3",
  "from": "GBFNGRIYGVD5K7VNVNYLOZLGGU4VYTUJBK7CCOCEWQ5T57WUMXCMQ3HE",
  "to": "GANJJAOOXXB7IBSKRQ56GFTZIF73M5WFPXCAHRDRJYJLDDSQORINWZ2O",
  "expiry": 1793811090,
  "status": "Completed",
  "indexerStatus": "SYNCED",
  "latestObservedLedger": 5612126
}
```

Transfer `status` is `Pending`, `Completed` or `Cancelled`. The smoke script set this offer's expiry equal to the right's maturity, which the contract allows (`expiry <= maturity`).

## Caching and freshness

Responses are never cached (`cache-control: no-store`). Always check `indexerStatus` and `latestObservedLedger` in the body. If the status is not `SYNCED`, the numbers may be behind the chain.
