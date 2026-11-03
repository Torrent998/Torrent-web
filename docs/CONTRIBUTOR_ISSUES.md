# Contributor tasks for Torrent-web

Scoped tasks for contributors, including Drips Wave participants. Each one is real remaining work in this repository, with acceptance tests. They are opened as GitHub issues when a maintainer is ready to review them; nothing here is claimed as done or as funded.

Sizes: small (a day or two), medium (up to a week), large (more, usually with an ADR).

## 1. Playwright end-to-end suite on recorded fixtures

- **Motivation:** Component tests do not cover routing, theming or the real browser.
- **Touches:** new `tests/e2e/`, CI workflow
- **Acceptance:** Sign-in -> circle -> funding request -> signing panel runs against `fixtures/api-examples.v1.json` via route mocks in CI, at 1440 px and 390 px.
- **Size:** medium
- **Non-goals:** Live network or chain calls.

## 2. Low-connectivity banner and offline read-only mode

- **Motivation:** The SRD requires retry, offline read-only and recovery messaging.
- **Touches:** `src/lib/use-async.ts`, `src/components/ui.tsx`
- **Acceptance:** Going offline shows a banner, keeps the last data clearly marked stale, disables signing, and recovers on reconnect; tested with mocked `navigator.onLine` events.
- **Size:** small
- **Non-goals:** Caching data as an accounting record.

## 3. Localized dates and maturity countdowns

- **Motivation:** Maturities and offer expiries are shown as ISO strings.
- **Touches:** `src/features/view.ts` and panels
- **Acceptance:** Dates use `Intl.DateTimeFormat` with the user's locale and an exact UTC tooltip; tests pin the time zone.
- **Size:** small
- **Non-goals:** Changing stored formats.

## 4. Automated accessibility checks

- **Motivation:** Accessibility is reviewed by hand today.
- **Touches:** tests
- **Acceptance:** axe runs on the landing page and every app screen in tests and fails on serious violations.
- **Size:** small
- **Non-goals:** Visual redesign.

## 5. Live Freighter run on Testnet

- **Motivation:** The Freighter adapter and `RpcTxPreparer` are tested with a stand-in extension and a mocked RPC only.
- **Touches:** `src/lib/wallet/freighter.ts`, docs
- **Acceptance:** After a Torrent-contracts Testnet deployment, sign in, fund, propose/accept and claim with Freighter against a local API and indexer; transaction hashes and any fixes recorded.
- **Size:** small
- **Non-goals:** Other wallets; Mainnet.

## Already done

Earlier items on this list (the Freighter browser-wallet adapter, the ABI v2 flows, cross-repo schemas and golden fixtures, per-repo CI, the intent state machine and reconciliation, coverage-invariant and double-claim property tests, transfer authorization, and indexer replay/backfill) are implemented; see each repository's README status table.
