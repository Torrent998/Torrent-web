# Torrent — Environment, Deployment and Recovery

## Environment boundaries
- Local: deterministic Docker Compose services, Stellar local network/Testnet, synthetic users/fixtures.
- Staging: separate database, bucket, API credentials, signing identities, Testnet assets/contracts, observability.
- Production: requires security audit, real issuer/provider agreements and relevant jurisdictional legal/compliance review. Not included in preimplementation scaffold.

## Suggested variables (non-secret examples only)
```dotenv
APP_ENV=development
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
DATABASE_URL=postgresql://localhost:5432/torrent
REDIS_URL=redis://localhost:6379
API_BASE_URL=http://localhost:3001
CHAIN_START_LEDGER=0
LOG_LEVEL=info
```
- Credentials to sign on-chain go into a secure secret manager or hardware-backed user wallet, never into a public mobile/web bundle.
- Signed store badge links are configured after actual publication; no fabricated App Store or Google Play app URLs.

## CI & GitHub setup
- GitHub Actions per repo: formatting/lint, schema checks, unit tests, dependency scanning; chain/devices smoke tests where supported.
- Branch protection and PR review recommended.
- Release tag points to tested sibling versions in an integration lockfile.
- All paths use offline/synthetic test fixtures, not real user financial records.

## Failure recovery
- Rebuild indexers from ledger cursor; compare DB projection vs chain truth.
- Restore DB backups after verifying transaction-intent reconciliation.
- Never republish user transactions solely because a client request timed out.
- Test signing-key rotation, dependency outages, stale quotes, malicious user input, insufficient balances and duplicate delivery.
- External reference infrastructure may change; check upstream project versions and licenses at build time.

## Build against Testnet (2026-11-04)

`.env.local`: `NEXT_PUBLIC_API_BASE_URL=http://localhost:4001`, `NEXT_PUBLIC_STELLAR_NETWORK=testnet`,
`NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org`. `npm run build` passes with these values.
The web app has **not** been exercised with a real Freighter wallet; the owner's numbered click-through is in
[FREIGHTER_WALKTHROUGH.md](./FREIGHTER_WALKTHROUGH.md). The web UI has no buttons yet for the organizer endpoints
(create pool, issue right, close pool), which exist in the API.

## Hosted deployment (2026-11-05)

Vercel project `torrent-web` (domain `torrent-web1.vercel.app`), Production environment variables, all public values:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://torrent-api-ckiq.onrender.com` (Torrent-api on Render, free plan) |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` |

`NEXT_PUBLIC_*` values are baked in at build time, so changing one needs a new build. The API only answers browsers whose
origin is listed in its `CORS_ALLOWED_ORIGINS` (set to `https://torrent-web1.vercel.app` on Render; preflight from that origin
returned 204 and another origin 403 when checked). The Render API is on a free instance: it sleeps when idle, so the first
request after a pause can take 50 seconds or more.
