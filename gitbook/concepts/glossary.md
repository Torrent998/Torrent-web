# Glossary

| Term | Meaning |
|---|---|
| **Circle** | The off-chain agreement between a group: name, members, and a rule set. Stored by the API. Becomes enforceable on-chain once bound to a pool. |
| **Rule set** | The agreed rules as JSON: token contract, `maxMembers` (2 to 50), `rounds` (1 to 50), `roundLengthDays` (1 to 366), `contributionAmount`, `transferPolicy` (`MEMBERS_ONLY`). |
| **Policy hash** | SHA-256 of the canonical (sorted-key) JSON of the rule set. Written on-chain as `membership_policy_hash`. |
| **Pool** | The on-chain object that holds a circle's money and totals. One contract hosts many pools, each with a `pool_id`. |
| **Controller** | The account that runs a pool: allows members, issues rights, pauses, closes, withdraws unreserved money. Can be rotated in two steps. |
| **Member** | An address that was allowed by the controller and joined by signing the policy hash. |
| **Payout right** | A claim on a fixed amount of a pool's token, unlocking at a maturity time. Created by `issue_right`. |
| **Maturity** | Unix time (seconds) when a right can be claimed. From that moment it can no longer be traded. |
| **Funded / reserved / claimed / withdrawn** | The four running totals of a pool. See [The backing invariant](backing-invariant.md). |
| **Held** | `funded - claimed - withdrawn`: tokens the contract still holds for the pool. |
| **Unreserved** | `held - reserved`: value that backs no right. The controller may withdraw it. |
| **Transfer** | A two-step hand-over of a right: the owner proposes, the recipient accepts. |
| **Expiry** | The time an open transfer offer stops being acceptable. Must be after now and not after the right's maturity. |
| **Admin** | The contract-level account for upgrades. Can rotate itself and manage timelocked upgrades. No power over pools. |
| **Intent** | An API object describing exactly one contract call a wallet is asked to sign. Has a state machine. |
| **Indexer** | The service that reads contract events and rebuilds state. Read-only. |
| **Reconciliation** | Comparing the indexer's rebuilt state with the contract's own getters. A mismatch halts the indexer. |
| **Finality (`CONFIRMED` / `SUBMITTED`)** | An event is `CONFIRMED` once the latest observed ledger is at least `confirmations` ledgers past it. |
| **SAC** | Stellar Asset Contract: the Soroban token interface for a Stellar asset. The Testnet pool used the native XLM SAC. |
| **Base units** | The smallest token unit. Stellar tokens use 7 decimals, so `10000000` base units is `1.0000000` of the token. |
| **Testnet** | Stellar's test network. Tokens have no value. |
| **Wave** | A Drips Wave contribution sprint. See [Contributing](../community/contributing.md). |
