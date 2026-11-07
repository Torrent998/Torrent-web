# Contributing to Torrent-web

Thanks for helping build Torrent. This repository is the Next.js app and landing page. It asks the member's wallet to sign and never holds a key. Work that belongs to another boundary goes to the
sibling repository that owns it (all four are in the [Torrent998](https://github.com/Torrent998) organization).

## How work is organized (Stellar Wave)

Torrent takes part in the Stellar Wave program on [Drips](https://www.drips.network/wave/stellar). Scoped tasks are GitHub issues:

- They carry the `Stellar Wave` label and exactly one complexity label: `trivial` (100 points), `medium` (150) or `high` (200), following Drips' guidance.
- Each issue has a Summary, Context, Scope, Implementation notes, Acceptance criteria (a checklist) and the tech stack involved. If anything is unclear, ask on the issue before you start.
- Browse them: [open Stellar Wave issues](https://github.com/Torrent998/Torrent-web/issues?q=is%3Aissue+is%3Aopen+label%3A%22Stellar+Wave%22). Good first tasks are labeled `good first issue`.
- To take one, comment with a two-line plan and wait for a maintainer to assign it. Keep to one open claim at a time so others get a chance.
- Points and rewards are handled by Drips under [its terms](https://docs.drips.network/wave/terms-and-rules). Maintainers do not promise rewards, and approval of this repository is up to Drips.

## Set up

```bash
git clone https://github.com/Torrent998/Torrent-web && cd Torrent-web
npm ci
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_STELLAR_NETWORK, NEXT_PUBLIC_STELLAR_RPC_URL
npm run check                # lint, typecheck, tests
npm run build
npm run dev                  # http://localhost:3000
```

Requires Node 22.12 or newer. Wallet flows need the Freighter browser extension set to Testnet; [docs/FREIGHTER_WALKTHROUGH.md](./docs/FREIGHTER_WALKTHROUGH.md) is a numbered manual test script.

## What every change needs

- Tests for the behavior and for the failure paths, not only the happy path. Do not weaken or delete a test to get a green build.
- UI changes need a note on accessibility (keyboard and contrast) and, for visible changes, an honest screenshot from the running app. Never add a feature that holds or asks for a secret key.
- Record architecture changes as an ADR in [docs/adr/](./docs/adr/).
- Keep commits small and use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- The gate is `npm run check` and `npm run build`. It is the same gate CI runs, and it must pass before you open a PR.

## Rules that do not bend

- No payout right without escrowed backing.
- Nothing is shown as settled before the ledger confirms it.
- No secret key, seed phrase or token in code, tests, fixtures, logs or screenshots.
- Testnet and synthetic data only.

## Pull requests and review

1. Fork, branch from `main`, make the change, run the gate.
2. Open a PR that links the issue (`Closes #123`) and fills in the template: what changes, why it belongs here, sibling impact, tests and evidence, security and Stellar impact.
3. A maintainer reviews against the issue's acceptance criteria. Expect a first response within a few days (best effort, not a promise). Reviewers ask for changes in the open, and a PR that stalls for two weeks without a reply may be closed.
4. Do not include fabricated results, screenshots of things you did not run, or numbers you did not measure.

## Conduct and security

By taking part you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md). Report vulnerabilities privately as described in [SECURITY.md](./SECURITY.md), never in a public issue.
Questions about the design go to [GitHub Discussions](https://github.com/Torrent998/Torrent-web/discussions).
