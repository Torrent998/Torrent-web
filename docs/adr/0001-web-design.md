# ADR 0001 — Thin, honest client over torrent-api

Status: accepted (M3 slice, started early because M1/M2 of the siblings exist). Sources: `docs/UX_FLOWS.md`, `docs/BRAND.md`, `docs/SRD.md`, `docs/TECHNICAL_BUILD.md`.

## Decisions
1. **The web app is not an accounting book.** Coverage, ownership, maturity and balances are rendered only from `torrent-api` responses (themselves ledger-derived via `torrent-indexer`), with the ledger number and indexer status shown next to them. While loading or after an error no stale numbers are displayed.
2. **Status copy never overstates settlement.** Only `CONFIRMED` is styled as success; `SUBMITTED` reads "Submitted, not yet confirmed"; `RECONCILING` says the outcome is unknown and is not retried; `FAILED` says nothing changed on-chain. Covered by `tests/view.test.ts` and `tests/components.test.tsx`.
3. **No keys in the app.** The user signs outside the app (their wallet/CLI) and pastes the signed XDR; the API verifies it equals the approved intent before forwarding. No seed/secret input exists; the sign-in form rejects non-`G` addresses. Token + public address live in `sessionStorage` only. A wallet integration (e.g. a browser wallet kit) is future work.
4. **Fail closed on contract drift.** Every API response is validated by Zod; a mismatch shows an error instead of rendering guessed data. `tests/contract.test.ts` checks the mirrored `fixtures/api-openapi.v1.json` (from torrent-api) against the endpoints and fields this app uses.
5. **Money** is integer base units end to end (`src/lib/money.ts`); user input is parsed to base units with at most 7 decimals; the raw base units are shown next to human amounts in the signing request.
6. **Idempotency**: intent-creating calls send an `Idempotency-Key`; callers can supply the key to retry safely.
7. Design is intentionally plain (brand colors, flat mark, dark/light, reduced motion, 44px targets, labelled forms); visual polish is deferred per `docs/BRAND.md`.

## Update (wallet + remaining screens)
Sign-in is a wallet-signature challenge; signing goes through a `WalletAdapter` (manual paste, or a labeled throwaway TEST wallet for development). Recipient approval, invitations, claim history and the audit view now exist.

## Not done
- A real browser-wallet adapter; Playwright/device E2E; real-network E2E (no Testnet deployment exists).
- Session survives reload (token in sessionStorage) but the wallet must be reconnected to sign.
