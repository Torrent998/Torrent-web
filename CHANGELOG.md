# Changelog
## Unreleased
- Landing page: animated savings-circle story, interactive "trade your payout date" explainer, illustrated audiences
  and an "under the hood" invariant diagram (inline SVG/CSS, reduced-motion safe, synthetic data only). Screenshots retaken.
- Freighter browser-wallet adapter behind `WalletAdapter` (`@stellar/freighter-api` 6.0.1, feature-detected,
  RPC-prepared transactions via `NEXT_PUBLIC_STELLAR_RPC_URL`); not yet run against live Testnet.
- torrent-escrow ABI v2 through torrent-api: withdraw a transfer offer, leave a pool, closed pools, claim-only matured
  rights, offers capped at maturity, contract-upgrade disclosure banner. 102 tests.
- Launch-quality landing page (hero with animated, labelled-synthetic pool illustration; how it works; features; trust and safety; architecture; FAQ), brand design system with light/dark themes and reduced-motion support, polished app screens, fix for a session hydration mismatch, README with screenshots, community health files.
- Next.js 16 app: landing, circles list/create, circle detail (ledger-derived coverage and rights, funding, transfer proposal and claim requests, signed-XDR submission with honest status).
- Zod-validated API client with consumer contract test against the mirrored torrent-api OpenAPI.
