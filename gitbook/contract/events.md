# Events

Every state change emits an event. The schema is `bindings/events.v2.json` in Torrent-contracts and is mirrored as a fixture in the indexer and the API.

## Envelope rules

* `topics[0]` is the event name as a symbol (`pool_created`, `funded` and so on).
* Fields marked as topics follow in order. The remaining fields are in the event data, a map.
* Every event carries `network_id`: the SHA-256 of the network passphrase. A consumer must reject events whose `network_id` does not match its configured network. The indexer does this and halts on a mismatch.
* The emitting contract's id is part of the Soroban event envelope. It is not a field.
* `i128` amounts are integer base units. The indexer serializes them as decimal strings.
* No personal data is ever emitted.
* **Every** transfer status change has an event. An expired offer that is replaced, and an open offer voided by a claim, both emit `transfer_cancelled` *before* the `transfer_proposed` or `right_claimed` of the same transaction.

## Pool and member events

| Event | Topics | Data |
|---|---|---|
| `pool_created` | `pool_id` | `network_id`, `controller`, `token`, `membership_policy_hash`, `start_ledger` |
| `member_joined` | `pool_id` | `network_id`, `member` |
| `member_removed` | `pool_id` | `network_id`, `member` |
| `member_left` | `pool_id` | `network_id`, `member` |
| `pool_paused` | `pool_id` | `network_id` |
| `pool_unpaused` | `pool_id` | `network_id` |
| `pool_closed` | `pool_id` | `network_id` |
| `controller_proposed` | `pool_id` | `network_id`, `controller`, `proposed` |
| `controller_changed` | `pool_id` | `network_id`, `previous`, `controller` |

## Money and right events

| Event | Topics | Data |
|---|---|---|
| `funded` | `pool_id` | `network_id`, `receipt_id`, `from`, `amount`, `funded_total` |
| `right_issued` | `pool_id`, `right_id` | `network_id`, `owner`, `amount`, `maturity`, `reserved_total` |
| `right_claimed` | `pool_id`, `right_id` | `network_id`, `owner`, `recipient`, `amount`, `claimed_total` |
| `unreserved_withdrawn` | `pool_id` | `network_id`, `to`, `amount`, `withdrawn_total` |

`funded_total`, `reserved_total`, `claimed_total` and `withdrawn_total` carry the running totals after the change. An indexer can check its own arithmetic against them.

## Transfer events

| Event | Topics | Data |
|---|---|---|
| `transfer_proposed` | `right_id`, `transfer_id` | `network_id`, `from`, `to`, `expiry` |
| `transfer_completed` | `right_id`, `transfer_id` | `network_id`, `from`, `to` |
| `transfer_cancelled` | `right_id`, `transfer_id` | `network_id` |

## Contract-level events (no id topic)

| Event | Data |
|---|---|
| `admin_proposed` | `network_id`, `admin`, `proposed` |
| `admin_changed` | `network_id`, `previous`, `admin` |
| `upgrade_proposed` | `network_id`, `wasm_hash`, `executable_after` |
| `upgrade_cancelled` | `network_id`, `wasm_hash` |
| `contract_upgraded` | `network_id`, `wasm_hash` |
| `upgrades_locked` | `network_id` |

## Events that do not exist

The constructor, `allow_member` and the view functions emit nothing. That has two consequences:

* An indexer cannot learn the admin address from events until the first `admin_changed`.
* An indexer cannot see allow-list entries. It sees members only when they join.

## An event as the indexer serves it

This is a real `right_issued` event from `GET /v1/ledger/events` on the hosted indexer:

```json
{
  "id": "0023867627185131520-0000000000",
  "ledger": 5557115,
  "ledgerClosedAt": "2026-11-04T16:20:15Z",
  "txHash": "331943b9948edf79dc7d2467ba41098773843608fc53d07d938f6da8d4935091",
  "contractId": "CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG",
  "name": "right_issued",
  "refs": { "poolId": "5", "rightId": "1" },
  "data": {
    "owner": "GBFNGRIYGVD5K7VNVNYLOZLGGU4VYTUJBK7CCOCEWQ5T57WUMXCMQ3HE",
    "amount": "6000000",
    "maturity": "1793809271",
    "reserved_total": "6000000"
  },
  "finality": "CONFIRMED"
}
```

The indexer's response also includes a `reconciliation` block for downstream systems. See [Indexer HTTP API](../indexer/http-api.md).
