# Torrent

Torrent is a savings circle where every payout right is backed by money that is already locked in a smart contract.

In a normal rotating savings circle, members pay in every month and one member takes the pot each round. Whoever is paid late is trusting the others to keep paying. Torrent removes that trust. A payout right can only be created if the contract already holds the money to pay it. Members can then trade the *date* they get paid with each other, because the claim they hold is real.

{% hint style="warning" %}
**Testnet prototype.** Everything here runs on the Stellar Testnet with synthetic funds. The contract is not audited. No real money should ever be used. See [Project status](start/status.md) for what is proven and what is not.
{% endhint %}

## What exists today

| Piece | What it is | Where |
|---|---|---|
| `torrent-escrow` | Soroban smart contract (ABI v2). Holds the funds, enforces the backing rule, handles transfers and claims. | [Torrent-contracts](https://github.com/Torrent998/Torrent-contracts) |
| `torrent-indexer` | Reads the contract's events from Soroban RPC, rebuilds the state, checks it against the contract, serves a read-only API. | [Torrent-indexer](https://github.com/Torrent998/Torrent-indexer) |
| `torrent-api` | Checks every action against the indexed ledger state, builds the transaction a wallet must sign, verifies what comes back. | [Torrent-api](https://github.com/Torrent998/Torrent-api) |
| `torrent-web` | Next.js app and landing page. Wallet sign-in with Freighter. | [Torrent-web](https://github.com/Torrent998/Torrent-web) |

The contract is live on Stellar Testnet at [`CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG`](https://stellar.expert/explorer/testnet/contract/CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG). The app is hosted at <https://torrent-web1.vercel.app>. The API and indexer run on free Render instances, so the first request after a pause can take 50 seconds or more.

## How to read these docs

* **New here?** Start with [What Torrent is](start/what-is-torrent.md), then [How it works](start/how-it-works.md).
* **Want the rules?** Read [The backing invariant](concepts/backing-invariant.md) and the [worked example](concepts/worked-example.md). Every number in it comes from a real Testnet pool.
* **Using the app?** Go to the guides for [organizers](guides/organizer.md), [members](guides/member.md) and [auditors](guides/auditor.md).
* **Building on it?** Use the [contract reference](contract/functions.md), the [API reference](api/overview.md) and [local setup](developers/local-setup.md).
* **Reviewing it?** Read [Security](security/security.md), the [Testnet evidence](evidence/testnet-evidence.md) and [Roadmap and known gaps](project/roadmap.md).

## Ground rules for this documentation

* Every function, error code, event and field comes from the source code, not from memory.
* Every sample was run. Samples in [Code samples](developers/code-samples.md) print the values shown.
* Where something was never tested, the page says so. The biggest gap: nobody has run the Freighter wallet flow against the hosted site yet.
* Amounts are integers in token base units (7 decimals on Stellar), never floating point.
