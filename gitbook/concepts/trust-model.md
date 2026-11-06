# Trust model

This page lists who has power over what, what each component is trusted to do, and what a failure of each one costs.

## Powers of each actor

| Actor | Can | Cannot |
|---|---|---|
| **Pool controller** | create the pool, allow and remove members (before funding), issue rights up to the backing limit, pause, unpause, close, withdraw **unreserved** money, name a successor | touch reserved money, change the policy hash, claim a right it does not own, edit membership after funding |
| **Member** | join with the policy hash, deposit, propose and accept transfers, claim own matured rights, leave when owning no open right | issue rights, withdraw, change another member's rights |
| **Right owner** | transfer before maturity, claim at or after maturity, withdraw its own open offer | claim early, claim twice |
| **Contract admin** | rotate itself in two steps, propose, cancel, execute and lock upgrades | pause, close, withdraw or issue in any pool; move any funds |
| **Anyone** | read every view function and event | change state without the right account's signature |

All of this is enforced by `require_auth()` on the specific account in the contract code, not by the API.

## What each component is trusted for

| Component | Trusted for | Not trusted for |
|---|---|---|
| **Contract** | everything that moves money or changes ownership. It is the only authority. | nothing else. It is unaudited. |
| **Indexer** | showing state quickly | it is derived data. It is checked against the contract and halts on any mismatch. |
| **API** | early refusal of calls that would fail, and routing signing requests | moving money or deciding ownership. It never holds a key and cannot sign. |
| **Web app** | showing state and asking the wallet to sign | secrets. It never asks for a key or seed phrase. |
| **Wallet (Freighter)** | holding keys and signing what the user approves | nothing is assumed beyond that |

## How the API keeps itself honest

The API does not decide balances or ownership. For every action it:

1. reads the current state from the indexer, and refuses if the indexer is halted (`INDEXER_HALTED`), stale (`INDEXER_STALE`, more than 10 ledgers behind by default) or on another network (`NETWORK_MISMATCH`);
2. checks the action against that state (for example, "only the on-chain owner can transfer this right");
3. returns an *intent*: the exact function and arguments the wallet must sign;
4. when the signed transaction comes back, verifies it is a single Soroban invocation of exactly that contract, function and arguments, sourced from the intent's actor, on the configured network, with a valid signature from that actor. Fee-bump transactions are refused;
5. only marks the intent confirmed when the indexer shows the matching event for the transaction hash.

If the API is wrong or malicious, the worst it can do is refuse service or ask for a signature on a call the user can inspect. The contract rejects anything that breaks its rules.

## Wallet sign-in

Sign-in proves control of an address. The server issues a one-time message. The wallet signs it with `signMessage` (an ed25519 signature over the account key) and returns the signature. The message says that signing does not authorize any payment. A challenge lives 5 minutes and is consumed on any attempt with a well-formed signature, so it cannot be brute-forced. A session lasts 12 hours. See [Authentication](../api/authentication.md).

## Failure modes

| If this fails | What happens |
|---|---|
| Indexer is down or behind | the API refuses sensitive actions. The contract and any funds are unaffected. |
| Indexer data disagrees with the contract | the indexer halts in `RECONCILING` and the API refuses sensitive actions until an operator investigates. |
| API is down | users cannot get signing requests from it. They can still call the contract directly with any tool. |
| A signature is lost after sending | the intent stays `SUBMITTED`, and reconciliation resolves it by transaction hash. It is never retried with changed parameters. |
| The controller key is lost | the pool keeps working for claims. No new rights can be issued. Rotation needs the current controller's signature, so a lost key cannot be rotated. |
| Upgrade proposed by the admin | `upgrade_proposed` is emitted with an `executable_after` time seven days ahead. Members and the indexer can see it before it can take effect. |

## What is not covered

There is no audit. The upgrade timelock is disclosure, not protection: after seven days a hostile admin could install different code. That is why this prototype must never hold real funds. See [Security](../security/security.md).
