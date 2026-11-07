<div align="center">

<img src="./brand/icon.svg" alt="Torrent logo" width="96" height="96" />

# Torrent-web

**The Torrent app and landing page: see which payouts are fully funded, trade their timing, and sign with your own wallet.**

[![CI](https://github.com/Torrent998/Torrent-web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Torrent998/Torrent-web/actions/workflows/ci.yml)
[![Docs](https://github.com/Torrent998/Torrent-web/actions/workflows/docs.yml/badge.svg?branch=main)](https://github.com/Torrent998/Torrent-web/actions/workflows/docs.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-42DEB4.svg)](./LICENSE)
[![Network: Stellar Testnet](https://img.shields.io/badge/network-Stellar%20Testnet-00191C.svg)](#status)
[![Status: prototype, unaudited](https://img.shields.io/badge/status-prototype%2C%20unaudited-A5F9DE.svg)](#security)
[![Next.js 16](https://img.shields.io/badge/next.js-16-black.svg)](./package.json)

[Live app](https://torrent-web1.vercel.app) · [Docs](./gitbook/README.md) · [Quick start](#quick-start) · [Contract on Testnet](https://stellar.expert/explorer/testnet/contract/CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG) · [Architecture](./docs/ARCHITECTURE.md) · [Contributing](./CONTRIBUTING.md)

</div>

---

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/screenshots/landing-hero-1440-dark.png" />
  <img src="./docs/screenshots/landing-hero-1440-light.png" alt="Torrent landing page: payout rights that are funded before they exist, with an illustration of a funded escrow pool and its payout rights" />
</picture>

## What this is

In a savings circle, members pay into a shared pot and take turns receiving it. Torrent lets members trade the timing of a payout, but only for payouts that are already fully
funded. This repository is the part people see: a landing page that explains the idea with synthetic examples, and an app where a member signs in with a wallet, sees a circle's
escrow coverage and payout rights, and signs each deposit, transfer or claim in their own wallet. Nothing is shown as settled until the ledger confirms it, and the app never
asks for, receives or stores a secret key.

## Status

Torrent is a **Testnet prototype with synthetic funds. It has not been audited.**

| Area | State |
|---|---|
| Landing page: how it works, savings-circle story, trade-your-date explainer, under-the-hood invariant diagram, safety, FAQ | implemented, tested |
| Wallet sign-in (challenge, sign, session) with **Freighter as the primary path**: feature-detected, fails closed on a network, account or transaction mismatch | implemented and tested with a stand-in extension. **No real Freighter wallet has been run against it yet** |
| Other wallet paths | "Use a different wallet" (sign elsewhere and paste), and a development-only test wallet behind `NEXT_PUBLIC_ENABLE_TEST_WALLET=1` |
| Circles, coverage, rights, funding, transfer proposal, approval and withdrawal, claims, leaving a pool, contract-upgrade disclosure, invitations, history, audit trail | implemented |
| Honest states: loading, empty, retryable outage, refusal, expired, submitted versus confirmed, reconciling | implemented |
| Hosted | [torrent-web1.vercel.app](https://torrent-web1.vercel.app) on Vercel, calling the Torrent API on Render's free plan (which sleeps when idle: the first request can take 50 seconds or more) |
| Organizer actions (create pool, issue right, close pool) | exist in the API; **no buttons in the app yet** |
| Cross-repo contract | the real recorded Torrent-api responses in `fixtures/api-examples.v1.json` parse with the web schemas, and endpoints are checked against the mirrored OpenAPI |
| Security audit, Mainnet, production use | **no**, **no**, **no** |

Screens below are rendered from the real recorded API responses by a local route mock; no live chain was involved.

| Circle (desktop) | Circle (phone, dark) |
|---|---|
| <img src="./docs/screenshots/app-circle-1440-light.png" alt="Circle page with escrow coverage, payout rights, transfers and a signing request" width="560" /> | <img src="./docs/screenshots/app-circle-390-dark.png" alt="Circle page on a phone in dark mode" width="220" /> |

## How it fits together

Torrent is four repositories, each owning one boundary. This app talks only to the API and to the member's wallet; it never reads the chain for truth.

```mermaid
flowchart LR
  U(["Member wallet"]) -.->|signs each call| W
  W["<b>Torrent-web</b><br/>Next.js app"] -->|HTTPS, OpenAPI v1| A["<b>Torrent-api</b><br/>circles, invitations, signing requests"]
  A -->|ledger read models| I["<b>Torrent-indexer</b><br/>ledger-derived state"]
  A -->|user-signed transactions| C["<b>Torrent-contracts</b><br/>Soroban escrow on Stellar"]
  C -->|contract events via RPC| I
  classDef here fill:#42DEB4,stroke:#00191C,color:#00191C
  class W here
```

| Repository | Stack | Owns |
|---|---|---|
| [Torrent-contracts](https://github.com/Torrent998/Torrent-contracts) | Rust, Soroban SDK 29 | Escrow pools, fully backed payout rights, member-only transfers, one-time claims |
| [Torrent-indexer](https://github.com/Torrent998/Torrent-indexer) | TypeScript, Node 22, Stellar RPC | Event ingestion and the ledger-derived read models |
| [Torrent-api](https://github.com/Torrent998/Torrent-api) | TypeScript, NestJS, SQLite | Circles, invitations, wallet sign-in, the signing-request state machine |
| **[Torrent-web](https://github.com/Torrent998/Torrent-web)** (this repo) | TypeScript, Next.js 16, Tailwind CSS 4 | Landing page and app, Freighter wallet adapter |

Every signing request shows the exact contract call, an expiry and an honest lifecycle (`Sign`, `Submit`, `Ledger confirms`). Freighter builds and prepares each Soroban transaction in the
browser through the RPC URL and checks that the wallet is on Testnet before it signs.

## Tech stack

| Layer | Tools |
|---|---|
| Framework | Next.js 16 (App Router), React, TypeScript (strict) |
| Styling | Tailwind CSS 4, inline SVG and CSS illustrations, static under `prefers-reduced-motion` |
| Wallet | `@stellar/freighter-api` v6 behind a `WalletAdapter` interface, Stellar SDK for transaction preparation |
| Tests | Vitest and Testing Library, recorded API responses as fixtures |
| CI | GitHub Actions: lint, typecheck, tests, build |
| Hosting | Vercel (auto-deploys on push to `main`) |

## Quick start

Requires Node.js 22.12 or newer.

```bash
git clone https://github.com/Torrent998/Torrent-web && cd Torrent-web
npm ci
npm run check                 # eslint, typecheck, vitest
npm run build                 # production build
cp .env.example .env.local    # NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_STELLAR_NETWORK, NEXT_PUBLIC_STELLAR_RPC_URL
npm run dev                   # http://localhost:3000
```

The landing page works on its own. The app needs a running [Torrent-api](https://github.com/Torrent998/Torrent-api), which needs a [Torrent-indexer](https://github.com/Torrent998/Torrent-indexer)
following the deployed contract. For the hosted Testnet stack:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://torrent-api-ckiq.onrender.com` (default for local development: `http://localhost:3001`) |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` |

`NEXT_PUBLIC_*` values are baked in at build time, so changing one needs a new build, and the API only answers browsers whose origin is in its `CORS_ALLOWED_ORIGINS`.
To try the wallet flow, install Freighter, set it to Testnet and follow the numbered script in [docs/FREIGHTER_WALKTHROUGH.md](./docs/FREIGHTER_WALKTHROUGH.md).

## Project structure

```text
src/app/          routes: landing (/), circles, circle detail, invitations
src/components/   app shell, coverage, rights, transfers, signing panel, wallet connect, landing sections
src/features/     view models and formatting for money, coverage and lifecycle states
src/lib/          API client and schemas, session, wallet adapters (Freighter, manual, test wallet)
fixtures/         real recorded Torrent-api responses
tests/            view models, components, page flows, landing, wallet adapters, API client
gitbook/          the documentation site source (GitBook Git Sync)
docs/             architecture, security model, deployment notes, Freighter walkthrough, ADRs
```

Design records: [ADR 0001](./docs/adr/0001-web-design.md) (web design) and [ADR 0002](./docs/adr/0002-freighter-adapter.md) (Freighter adapter).

## Contributing

Contributions are welcome and Torrent takes part in the Stellar Wave program on Drips. Open, scoped tasks carry the
[`Stellar Wave`](https://github.com/Torrent998/Torrent-web/issues?q=is%3Aissue+is%3Aopen+label%3A%22Stellar+Wave%22) label and one complexity label
(`trivial`, `medium` or `high`). Read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## Security

Unaudited prototype, Testnet only, synthetic funds only. This app must never hold, ask for or log a secret key. Report vulnerabilities privately through GitHub's
[private vulnerability reporting](https://github.com/Torrent998/Torrent-web/security/advisories/new) as described in [SECURITY.md](./SECURITY.md).
The threat model is in [docs/SECURITY.md](./docs/SECURITY.md).

## Community

Questions and design discussion: [GitHub Discussions](https://github.com/Torrent998/Torrent-web/discussions).

## Maintainers

| Maintainer | Role | Link |
|---|---|---|
| Cjay | Maintainer, all four Torrent repositories | [@Cjay-Cyber-2](https://github.com/Cjay-Cyber-2) |

Organization: [Torrent998](https://github.com/Torrent998).

## Contributors

<a href="https://github.com/Torrent998/Torrent-web/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Torrent998/Torrent-web" alt="Contributors" />
</a>

## License

[MIT](./LICENSE)
