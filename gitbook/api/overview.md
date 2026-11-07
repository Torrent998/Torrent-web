# API overview

`torrent-api` is a NestJS service. It checks every action against the indexed ledger state, builds the contract call a wallet must sign, verifies the signed transaction and submits it. It never holds a key and cannot sign.

* Hosted: <https://torrent-api-ckiq.onrender.com> (free Render instance: the first request after a pause can take 50 seconds or more)
* Local default: `http://localhost:3001`
* Format: JSON over HTTP. The machine-readable description is `openapi/openapi.v1.json` (OpenAPI 3.1, 27 operations on 26 paths, plus `/healthz`) in [Torrent-api](https://github.com/Torrent998/Torrent-api).

## Conventions

| Topic | Rule |
|---|---|
| **Authentication** | `Authorization: Bearer <token>` on everything except `/healthz`, `POST /v1/auth/challenge` and `POST /v1/auth/login`. See [Authentication](authentication.md). |
| **Request bodies** | JSON, at most 64 KB. Unknown fields are rejected (`VALIDATION_ERROR`). |
| **Amounts** | Positive integer strings in base units, at most the `i128` maximum. Never floats. Pattern `^[1-9][0-9]{0,38}$`. |
| **Times** | ISO 8601 strings in the API. Contract fields such as `maturity` and `expiry` are Unix seconds as numbers or decimal strings, as the individual endpoints say. |
| **Addresses** | Stellar strkeys: accounts `G…`, contracts `C…`, 56 characters. |
| **Ids** | API objects have prefixed ids: `cir_` circle, `inv_` invitation, `int_` intent, `trf_` transfer, `aud_` audit event, `chal_` login challenge. Chain ids (`poolId`, `rightId`, `transferId`) are decimal strings. |
| **Caching** | Every response has `cache-control: no-store`. |
| **Request id** | Every response has an `x-request-id` header. You may send your own (8 to 64 characters of `A-Za-z0-9_-`). Otherwise the server makes one. It is repeated in error bodies. |
| **Rate limit** | 120 requests per 60 seconds per caller (a hash of the `Authorization` header plus the client IP). Over the limit: `429 RATE_LIMITED`. In memory, single process. |
| **CORS** | Off unless `CORS_ALLOWED_ORIGINS` is set. See [Deployment](../operations/deployment.md). |

## Errors

Every error has the same shape. Internal details and input values are never echoed.

```json
{ "error": { "code": "INSUFFICIENT_BACKING", "message": "only 4000000 is unreserved; issuing 5000000 would leave rights unbacked", "requestId": "req_132021e1-8f7a-47ec-90ea-74db825fa62c" } }
```

All codes are in [API error codes](errors.md).

## Idempotency

Endpoints that create an intent require an `Idempotency-Key` header: 8 to 128 characters of `A-Za-z0-9_-`.

* Same user, same key, same request: the stored reply is returned and exactly one business effect happens, even for concurrent duplicates.
* Same key with a different request: `409 IDEMPOTENCY_KEY_REUSED`. There is never a silent second intent.
* Missing or malformed key: `400 IDEMPOTENCY_KEY_REQUIRED`.

Use a fresh random key per user action. Reuse it only when retrying that same action after a timeout.

## The signing flow

Anything that changes the chain follows the same three steps. Details in [Intents and signing](intents.md).

```
1. POST  /v1/…/…-intent        (Idempotency-Key)   →  { intent: { state: "AWAITING_SIGNATURE", descriptor } }
2. wallet signs a transaction that invokes exactly descriptor.function(descriptor.args)
3. POST  /v1/intents/{id}/submit  { signedXdr }    →  { intent: { state: "SUBMITTED", txHash } }
   … the indexer sees the event …                  →  intent state becomes "CONFIRMED"
```

## Dependence on the indexer

The API reads ledger truth from the indexer. Sensitive actions are refused with `503` when the indexer is halted (`INDEXER_HALTED`), more than `MAX_INDEXER_LAG_LEDGERS` (10) behind (`INDEXER_STALE`), on another network (`NETWORK_MISMATCH`), unreachable (`INDEXER_UNREACHABLE`), erroring (`INDEXER_ERROR`) or on an unexpected schema (`INDEXER_SCHEMA_MISMATCH`).

## Endpoint map

| Group | Endpoints | Page |
|---|---|---|
| Health | `GET /healthz` | below |
| Authentication | `POST /v1/auth/challenge`, `/login`, `/logout` | [Authentication](authentication.md) |
| Circles and invitations | `POST/GET /v1/circles`, `GET /v1/circles/{id}`, `POST /v1/circles/{id}/invitations`, `POST /v1/invitations/accept` | [Circles](circles.md) |
| Intents | `GET /v1/intents/{id}`, `POST /v1/intents/{id}/submit`, `GET /v1/circles/{id}/intents` | [Intents](intents.md) |
| Funding, rights, transfers, leaving | `POST /v1/circles/{id}/funding-intents`, `GET …/coverage`, `GET …/rights`, `POST /v1/rights/{id}/transfers/intent`, `POST /v1/transfers/{id}/approve`, `…/cancel`, `…/submit`, `GET …/transfers`, `POST /v1/rights/{id}/claim-intent`, `POST …/leave-intent` | [Rights and transfers](rights-and-transfers.md) |
| Organizer | `POST /v1/circles/{id}/pool-intent`, `…/rights-intent`, `…/close-intent` | [Organizer](organizer.md) |
| Ledger, contract, audit | `GET /v1/ledger/events`, `GET /v1/contract`, `GET /v1/circles/{id}/audit` | [Ledger and audit](ledger-and-audit.md) |

## `GET /healthz`

No authentication. Returns `{"ok":true}`. The hosted API answered `200` with that body when checked.

## About the sample payloads

Request and response samples in this section come from the API's own OpenAPI example file (`openapi/api-examples.v1.json`), which a test keeps in sync with the code. Their ids, hashes and timestamps are **synthetic placeholders**, not Testnet data. Where a sample is real Testnet output, the page says so and links the evidence.
