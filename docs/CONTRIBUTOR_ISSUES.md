# Contributor tasks for Torrent-web

Scoped tasks for contributors, including Drips Wave participants. Each one is real remaining work in this repository, with acceptance tests. They are opened as GitHub issues when a maintainer is ready to review them; nothing here is claimed as done or as funded.

Sizes: small (a day or two), medium (up to a week), large (more, usually with an ADR).

## 1. Browser-wallet adapter (Freighter)

- **Motivation:** Users must currently sign elsewhere and paste. A browser-wallet adapter removes that friction.
- **Touches:** `src/lib/wallet/` (implement `WalletAdapter` from `types.ts`), `src/components/wallet-connect.tsx`
- **Acceptance:** Sign-in and intent signing work through the adapter; cancel, wrong-network and wrong-address paths show errors and submit nothing; tests use a mocked extension API that is labelled as such.
- **Size:** medium
- **Non-goals:** Storing keys; supporting Mainnet.

## 2. Playwright end-to-end suite on recorded fixtures

- **Motivation:** Component tests do not cover routing, theming or the real browser.
- **Touches:** new `tests/e2e/`, CI workflow
- **Acceptance:** Sign-in -> circle -> funding request -> signing panel runs against `fixtures/api-examples.v1.json` via route mocks in CI, at 1440 px and 390 px.
- **Size:** medium
- **Non-goals:** Live network or chain calls.

## 3. Low-connectivity banner and offline read-only mode

- **Motivation:** The SRD requires retry, offline read-only and recovery messaging.
- **Touches:** `src/lib/use-async.ts`, `src/components/ui.tsx`
- **Acceptance:** Going offline shows a banner, keeps the last data clearly marked stale, disables signing, and recovers on reconnect; tested with mocked `navigator.onLine` events.
- **Size:** small
- **Non-goals:** Caching data as an accounting record.

## 4. Localized dates and maturity countdowns

- **Motivation:** Maturities and offer expiries are shown as ISO strings.
- **Touches:** `src/features/view.ts` and panels
- **Acceptance:** Dates use `Intl.DateTimeFormat` with the user's locale and an exact UTC tooltip; tests pin the time zone.
- **Size:** small
- **Non-goals:** Changing stored formats.

## 5. Automated accessibility checks

- **Motivation:** Accessibility is reviewed by hand today.
- **Touches:** tests
- **Acceptance:** axe runs on the landing page and every app screen in tests and fails on serious violations.
- **Size:** small
- **Non-goals:** Visual redesign.

## Already done

Earlier items on this list (cross-repo schemas and golden fixtures, per-repo CI, the intent state machine and reconciliation, coverage-invariant and double-claim property tests, transfer authorization, and indexer replay/backfill) are implemented; see each repository's README status table.
