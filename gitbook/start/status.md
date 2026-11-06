# Project status

As of 2026-11-06. Everything is Stellar **Testnet** with synthetic funds. No security audit has been done.

## Working and checked

| Item | Evidence |
|---|---|
| Contract deployed on Testnet (ABI v2) | [`CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG`](https://stellar.expert/explorer/testnet/contract/CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG), deploy ledger 5553711 |
| Full contract lifecycle on Testnet (pool 8) | create pool, join, deposit, issue, transfer with two signatures, claim, leave, controller rotation, close, withdraw. Seven expected refusals were recorded by error code. See [Testnet evidence](../evidence/testnet-evidence.md). |
| Indexer follows the contract | `SYNCED`, 54 events indexed, no faults, when last read |
| API prepares real Soroban transactions that the network accepts | deposit, create pool, issue right and close pool each confirmed on Testnet through the API |
| Contract test suite | 57 tests in 7 files, all passing when last run |
| CI | green on `main` for contracts, indexer, API and web when last checked |
| Hosted | web on Vercel, API and indexer on Render (free plan) |

## Not done, or not proven

| Item | Status |
|---|---|
| **Freighter wallet flow** | Implemented and unit-tested with a mocked extension. **Nobody has run it against a real Freighter extension.** |
| Security audit | None. The contract can upgrade itself after a 7-day timelock, so an unaudited prototype must not hold real funds. |
| Contract constructor event | The constructor emits no event. The indexer shows `admin: null` until the first admin rotation. The contract's `get_governance` is authoritative. |
| Joining a pool through the API | The API has no signing request for `allow_member` or `join_pool`. The live runs used `stellar-cli` for those two steps. |
| Transfer and claim through the API on Testnet | Covered by unit tests. Not run live. |
| Consent-based rule amendments | Not built. Rules are fixed by the policy hash. |
| Browser end-to-end tests | None yet. |
| Persistent storage on the hosted API | The free Render plan has no disk. Data resets when the service restarts. |

## Reading this table

"Implemented and unit-tested" means code and tests exist. "Run live" means a transaction was submitted to Testnet and its hash is recorded. Those are different claims, and this documentation keeps them apart. See [Roadmap and known gaps](../project/roadmap.md) for what comes next.
