<img src="./brand/icon.svg" alt="Torrent logo" width="144" />

# torrent-web

> Torrent — Ownership of when money becomes available.

**Status: early vertical slice (dashboard, coverage, rights, funding / transfer-proposal / claim signing requests). Builds and passes tests; NOT connected to a live Testnet; no wallet integration; NOT production.** This repo is one of **exactly four meaningful independent codebases** in the Torrent Stellar-native project. It is not a placeholder created merely to increase Drips Wave submissions.

## Honest status
| Item | State |
|---|---|
| Landing, sign-in (dev token + public address), circles list/create | implemented |
| Circle page: coverage panel, rights table, funding, transfer proposal, claim, signing-request panel with polling | implemented; 36 tests (view models, components, page flows, API client, OpenAPI contract) |
| Honest states: loading, empty, retryable outage, refusal, expired, SUBMITTED vs CONFIRMED, reconciling | implemented |
| Recipient approval screen, invitations, audit view, claim history | **not built** |
| Wallet connection (signing happens outside the app; signed XDR is pasted) | **not built** |
| End-to-end against real torrent-api / indexer / Testnet | **never run** (no deployment exists). Tests use stubbed API clients |
| Authentication | API dev-token adapter only |

The app never asks for or stores a secret key. See `docs/adr/0001-web-design.md`.

## Local startup
```bash
npm ci
npm run check      # typecheck + eslint + vitest
npm run build      # next build (passes)
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL -> a running torrent-api
npm run dev        # http://localhost:3000
```
Stop with Ctrl-C. Needs `torrent-api` (which needs `torrent-indexer`, which needs a deployed `torrent-contracts`). Consumes torrent-api OpenAPI v1 (`fixtures/api-openapi.v1.json`, mirrored from torrent-api@3044b0d era).

## Owns
Savings-circle dashboard, governance and identity UX, fully-funded payout inventory, swap/transfer requests, signing and reporting

## Why it is separate
It has a distinct runtime/toolchain, external interface, tests, release cadence and maintainership boundary. Its siblings depend on its delivered interface, but implementation responsibilities must not be duplicated.

## Sibling repositories
- `torrent-api` — Authenticated groups, enrollment, policy state, off-chain agreements, transaction intent orchestration, RBAC, compliance and notifications
- `torrent-contracts` — Escrow of backed assets, immutable fully-funded payout rights, transfer restrictions, schedule enforcement, claims, authorized amendments
- `torrent-indexer` — Soroban event ingestion, canonical ledger-derived read models, reconciliation, replay/backfill, settlement status and event API

## Architecture and development context
Start with:
- `AGENTS.md` — coding agent rules;
- `docs/PRD.md` — product purpose and MVP;
- `docs/SRD.md` — user/system requirements, APIs and state;
- `docs/ARCHITECTURE.md` — four-repository responsibilities, data and execution paths;
- `docs/TECHNICAL_BUILD.md` — recommended bootstrap, testing, phases;
- `docs/SECURITY.md` — security/trust boundaries;
- `docs/BRAND.md` — approved flat logo and flexible UI direction;
- `docs/ROADMAP.md` — milestone acceptance gates.

## Technical target
Next.js web. The actual product implementation starts at milestone M0; no real-money transactions or claims exist in this scaffold.

## Minimal integration contract
Always test the dependency path stated in ARCHITECTURE.md. Every new public endpoint/ABI/package message must be versioned and covered by consumer fixtures. See `docs/SRD.md` and `docs/TECHNICAL_BUILD.md`.

## Drips Wave
Stellar is essential: Soroban escrow contract takes custody of already-funded supported Stellar assets. Approval/eligibility for Wave depends on substantive open-source implementation and organizer review, not repo count.


## Official project identity

The project uses the **approved flat SVG logo** in [`brand/icon.svg`](./brand/icon.svg), with an editable transparent vector mark in [`brand/mark.svg`](./brand/mark.svg). The [512 px GitHub organization avatar](./brand/org-avatar.png) is in the same directory. This logo is shared by all four project repositories. UI design remains intentionally flexible.
