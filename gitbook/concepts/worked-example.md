# Worked example: Testnet pool 8

This page follows one real pool through its whole life. All numbers are in base units (7 decimals, so `10000000` is `1.0000000` of the token). The pool used the native XLM asset contract on Stellar Testnet. The accounts are throwaway smoke-test identities.

Everything below was recorded on 2026-11-04. The event list comes from the live indexer (`GET /v1/ledger/events`). The transaction hashes link to Stellar Expert.

## The sequence

| # | Step | Ledger | Totals after | Transaction |
|---|---|---|---|---|
| 1 | `create_pool` (pool id 8) | 5557390 | all zero | [`f36a643a…`](https://stellar.expert/explorer/testnet/tx/f36a643a90d5a9b105fcb8fe2cd00fd18673a88c4f694d69045b19396b8080ac) |
| 2 | `allow_member` then `join_pool` for each of two members. The allow-list calls emit no event: [`db13e59b…`](https://stellar.expert/explorer/testnet/tx/db13e59bc5535c6a39331ddca1a13e1a893777ceb268e5db00a2f2bb7b0244f5), [`a4236747…`](https://stellar.expert/explorer/testnet/tx/a4236747bafa4c2697cc69d16ed3c8c05d95a303b4facd410aa830a42e7e814b). The joins are the events at ledgers | 5557403, 5557417 | all zero | [`0e7eb5cf…`](https://stellar.expert/explorer/testnet/tx/0e7eb5cfef996d3ea935a9cffd69fe9db84558da7ec3c6b4f2138c92613daf62), [`ed503a60…`](https://stellar.expert/explorer/testnet/tx/ed503a60b03e9d91f920b75c0f85724aec5a7fd3c4408201f7f1a96d4bb004b0) |
| 3 | `deposit` 10 000 000 | 5557422 | funded 10 000 000 | [`5198d168…`](https://stellar.expert/explorer/testnet/tx/5198d1687d4adf73c9b4a57fcfc94b975753392fe0f45bea7b0fbb89a7f43c6c) |
| 4 | `issue_right` 10 000 001 (one unit too many) | | **refused**, error #10 `InsufficientBacking` | refused in simulation, no transaction |
| 5 | `issue_right` 6 000 000 to member A (right 3) | 5557433 | reserved 6 000 000 | [`516a2a6d…`](https://stellar.expert/explorer/testnet/tx/516a2a6db69d7ecb0551cd4f52b3ca043dd33f32fa2a7d0184cdc9c5d535b22c) |
| 6 | `propose_transfer` with expiry after maturity | | **refused**, error #16 `InvalidExpiry` | refused in simulation |
| 7 | `propose_transfer` right 3 to member B (transfer 2) | 5557442 | unchanged | [`eb729f4a…`](https://stellar.expert/explorer/testnet/tx/eb729f4ae3c437e8fc4d6521da6a5f508f9b169d399590194b7fd420027191cb) |
| 8 | `accept_transfer` signed by B | 5557448 | unchanged | [`cc55f497…`](https://stellar.expert/explorer/testnet/tx/cc55f49797c281273fdf1d788b2022799ceb93f376ff53d856141b500060a1ba) |
| 9 | `accept_transfer` again (replay) | | **refused**, error #18 `TransferNotPending` | refused in simulation |
| 10 | `claim` before maturity | | **refused**, error #12 `NotMatured` | refused in simulation |
| 11 | `leave_pool` while owning a right | | **refused**, error #29 `MemberHasRights` | refused in simulation |
| 12 | `claim` by B after maturity | 5557517 | reserved 0, claimed 6 000 000 | [`d00b4665…`](https://stellar.expert/explorer/testnet/tx/d00b4665072131b1eeb193bf0cdd819121de66a68bfb269586c05e961e8e15af) |
| 13 | `claim` again | | **refused**, error #13 `AlreadyClaimed` | refused in simulation |
| 14 | `leave_pool` by B | 5557524 | unchanged | [`2298f0e9…`](https://stellar.expert/explorer/testnet/tx/2298f0e919952163b1d749fa7191424bd74e83819a13fb6a8cdd13de6ed3d303) |
| 15 | `propose_controller`, `accept_controller` | 5557530, 5557539 | unchanged | [`76c38ba9…`](https://stellar.expert/explorer/testnet/tx/76c38ba9c6af2cdf20230d25dc3d53764317de991739b1cc3cc285792de8337a), [`e3807cc8…`](https://stellar.expert/explorer/testnet/tx/e3807cc87198bf7f9ebd23ccf8efbbfa4fec6e10da24c20d108b86817a1739a3) |
| 16 | `close_pool` | 5557546 | unchanged | [`f7b754da…`](https://stellar.expert/explorer/testnet/tx/f7b754dafac53ac588d04f6630fd74c58b3fc8901bb66c672503d44e30b91d50) |
| 17 | `deposit` after closing | | **refused**, error #27 `PoolClosed` | refused in simulation |
| 18 | `withdraw_unreserved` 4 000 000 | 5557555 | withdrawn 4 000 000 | [`e3240d58…`](https://stellar.expert/explorer/testnet/tx/e3240d58628cfe3960277b6863fa05987bf85ebe16abd1ff9fac7d4fa45b112f) |

The right had a maturity of Unix time `1793811090` (2026-11-04 16:51:30 UTC). The pool was created at 16:43:10 UTC and the last withdrawal closed at 16:56:55 UTC. The smoke script uses a short maturity on purpose so the whole lifecycle fits in minutes.

Steps 5 and 7: the smoke script did not record these two hashes. They were read from the indexed `right_issued` and `transfer_proposed` events instead.

## The arithmetic

This script replays the totals and checks the rule after every step. It is in [Code samples](../developers/code-samples.md). Its output:

```
deposit 10_000_000                 accepted  funded=10000000 reserved=0 claimed=0 withdrawn=0 held=10000000 unreserved=10000000
issue_right 10_000_001 (unbacked)  REFUSED (InsufficientBacking #10)  funded=10000000 reserved=10000001 ... held=10000000 unreserved=-1
issue_right 6_000_000              accepted  funded=10000000 reserved=6000000 claimed=0 withdrawn=0 held=10000000 unreserved=4000000
withdraw_unreserved 5_000_000      REFUSED (InsufficientBacking #10)  funded=10000000 reserved=6000000 claimed=0 withdrawn=5000000 held=5000000 unreserved=-1000000
claim right of 6_000_000           accepted  funded=10000000 reserved=0 claimed=6000000 withdrawn=0 held=4000000 unreserved=4000000
withdraw_unreserved 4_000_000      accepted  funded=10000000 reserved=0 claimed=6000000 withdrawn=4000000 held=0 unreserved=0
final {"funded":"10000000","reserved":"0","claimed":"6000000","withdrawn":"4000000"}
```

The refused withdrawal of 5 000 000 is an illustration of the rule, not a step that was run on Testnet. The other lines match the Testnet steps above.

## Checking it against the live pool

The indexer's view of pool 8 matches the replay:

```
GET https://torrent-indexer.onrender.com/v1/pools/8
```

```json
{
  "poolId": "8",
  "status": "Closed",
  "totals": { "funded": "10000000", "reserved": "0", "claimed": "6000000", "withdrawn": "4000000" },
  "coverage": { "unreserved": "0", "fullyBacked": true }
}
```

(trimmed). Funded 10 000 000 equals claimed 6 000 000 plus withdrawn 4 000 000. The pool is closed with nothing held: it is **settled**.

## What the example shows

* The unbacked right (step 4) was refused by the contract, not by the app.
* The transfer needed two transactions from two accounts (steps 7 and 8).
* Replays and early claims were refused (steps 9, 10, 13).
* A member with an open right could not leave (step 11).
* Closing the pool did not stop the claim or the withdrawal of unreserved money (steps 12 and 18 are the two kinds of exit).

## What it does not show

* Real Freighter signing. The accounts were `stellar-cli` identities.
* Real money, or any audit.
* The API path for joining a pool. That step used `stellar-cli` because the API has no request for it yet.
