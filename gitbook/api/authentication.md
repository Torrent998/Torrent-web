# Authentication

Torrent has no passwords. You sign in by proving control of a Stellar account: the server issues a one-time message, your wallet signs it, and the server verifies the signature. The server never sees a secret key. A session token proves control of the address and nothing more. It authorizes no payment.

## Flow

```
POST /v1/auth/challenge { address }            →  { challengeId, message, expiresAt }
wallet.signMessage(message)                    →  64-byte ed25519 signature (base64)
POST /v1/auth/login { challengeId, signature } →  { token, expiresAt, userId, address, roles }
Authorization: Bearer <token>   on every later call
POST /v1/auth/logout                           →  { ok: true }
```

## `POST /v1/auth/challenge`

Request body (extra fields are rejected):

```json
{ "address": "GAGCHSTWHAUDETF3L454Z7WDT7H57GYZZWRDO5NJ2EVMFGPLREWKTG23" }
```

`address` must be an account address matching `^G[A-Z2-7]{55}$`.

Response `201`:

```json
{
  "challengeId": "chal_jeOwWvC4F1LW5opcmvTR7Q",
  "message": "Torrent sign-in (Stellar Testnet prototype)\nnetwork: testnet\naddress: GAGCHSTWHAUDETF3L454Z7WDT7H57GYZZWRDO5NJ2EVMFGPLREWKTG23\nnonce: _DgzLO3z84Sedi5FzZbaBFB6XUg3AWivmZo4916QYKY\nissued: 2026-03-01T00:00:00.000Z\nexpires: 2026-03-01T00:05:00.000Z\nSigning proves you control this address. It does not authorize any payment.",
  "expiresAt": "2026-03-01T00:05:00.000Z"
}
```

The message is seven lines: title, network, address, a random nonce, issue time, expiry and a plain-language statement. A challenge is valid for **5 minutes**.

Errors: `400` (validation), `429`.

## `POST /v1/auth/login`

```json
{ "challengeId": "chal_jeOwWvC4F1LW5opcmvTR7Q", "signature": "<base64 of the 64-byte signature>" }
```

`signature` is 80 to 100 base64 characters (a 64-byte signature encodes to 88). The wallet signs the **exact** `message` string with the SEP-53 `signMessage` format. The server verifies it against the account's public key with `Keypair.verifyMessage`.

Response `200`:

```json
{
  "token": "R27Q8Sk5EA4XJdakIiltPzjEQGKbfIX0v3AegPKhfNA",
  "expiresAt": "2026-03-01T12:00:00.000Z",
  "userId": "usr_2a5dd70f21e3d7d4604eeaf5",
  "address": "GAGCHSTWHAUDETF3L454Z7WDT7H57GYZZWRDO5NJ2EVMFGPLREWKTG23",
  "roles": ["user"]
}
```

* `token` is 32 random bytes, base64url. Only its SHA-256 hash is stored on the server.
* A session lasts **12 hours**.
* `userId` is derived from the address, so the same account always gets the same user id.
* `roles` is `["user"]`, or `["user", "auditor"]` when the address is in the server's `AUDITOR_ADDRESSES`.

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `BAD_SIGNATURE` | the signature is not base64, or not 64 bytes |
| 401 | `UNAUTHENTICATED` | unknown, used or expired challenge, or the signature does not verify. **All four give the same message**, so a caller cannot tell which one failed. |
| 429 | `RATE_LIMITED` | too many requests |

A challenge is consumed on **any attempt with a well-formed signature**, whether it verifies or not. It cannot be brute-forced.

## `POST /v1/auth/logout`

Needs the bearer token. Marks the session revoked. Returns `{ "ok": true }`.

## Using the token

```bash
curl https://torrent-api-ckiq.onrender.com/v1/circles -H "Authorization: Bearer $TOKEN"
```

Without a valid token the API returns `401`:

```json
{ "error": { "code": "UNAUTHENTICATED", "message": "authentication required", "requestId": "req_…" } }
```

That is the real response of the hosted API for `GET /v1/circles` and `GET /v1/contract` without a token.

## What the web app does

The app keeps the token and your **public** address in `sessionStorage` only, which is cleared when the tab closes. It never asks for, receives or stores a secret key or seed phrase. See [Wallet sign-in](../web/wallet-signin.md).

## Signing a challenge yourself

If you do not use a browser wallet, any tool that can sign a Stellar message works. The [code samples](../developers/code-samples.md) show the exact message format to sign with `stellar-sdk`.
