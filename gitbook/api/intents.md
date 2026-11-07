# Intents and signing

An **intent** is the API's description of exactly one contract call that a wallet is asked to sign. It exists so nobody signs a call that is certain to fail, and so the API can later prove the transaction it submitted is the one the user approved.

## Intent object

```json
{
  "id": "int_gVWuZ_mtZLbOYce05d1IAw",
  "schemaVersion": 1,
  "requestId": "req_132021e1-8f7a-47ec-90ea-74db825fa62c",
  "kind": "FUNDING",
  "circleId": "cir_JYTKGl9r-_ET7GTUNDo-Gg",
  "state": "AWAITING_SIGNATURE",
  "descriptor": {
    "contractId": "CADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQP5KR",
    "function": "deposit",
    "args": [
      { "name": "pool_id", "type": "u64",     "value": "1" },
      { "name": "from",    "type": "address", "value": "GAGCHSTWHAUDETF3L454Z7WDT7H57GYZZWRDO5NJ2EVMFGPLREWKTG23" },
      { "name": "amount",  "type": "i128",    "value": "10000000000" }
    ]
  },
  "txHash": null,
  "failureReason": null,
  "verifiedAtLedger": 1000,
  "expiresAt": "2026-03-01T00:15:00.000Z",
  "createdAt": "2026-03-01T00:00:00.000Z",
  "updatedAt": "2026-03-01T00:00:00.000Z"
}
```

(synthetic values from the example file.)

| Field | Meaning |
|---|---|
| `kind` | `FUNDING`, `TRANSFER_PROPOSE`, `TRANSFER_ACCEPT`, `TRANSFER_CANCEL`, `CLAIM`, `POOL_LEAVE`, `POOL_CREATE`, `RIGHT_ISSUE` or `POOL_CLOSE` |
| `descriptor` | the single contract call: `contractId`, `function` and ordered, typed `args`. Types are `u64`, `i128`, `address`, `bytes32`. Values are strings (decimal for numbers, strkey for addresses, hex for bytes). **It is a description, not a transaction.** |
| `verifiedAtLedger` | the ledger the preconditions were checked against. Informational: the chain decides. |
| `expiresAt` | when the approval lapses. 15 minutes after creation by default (`INTENT_TTL_SECONDS`). |
| `txHash` | set once a signed transaction was submitted |
| `failureReason` | set when the state is `FAILED` |

## State machine

```
DRAFT ─► VERIFIED ─► AWAITING_SIGNATURE ─► SUBMITTED ─► CONFIRMED
  │          │               │                 │  ▲
  └──────────┴───────────────┴─────────────────┤  │
                  FAILED ◄─────────────────────┘  │
                                                  │
                       RECONCILING ───────────────┘ ─► CONFIRMED | FAILED
```

Allowed moves:

| From | To |
|---|---|
| `DRAFT` | `VERIFIED`, `FAILED` |
| `VERIFIED` | `AWAITING_SIGNATURE`, `FAILED` |
| `AWAITING_SIGNATURE` | `SUBMITTED`, `FAILED` |
| `SUBMITTED` | `CONFIRMED`, `FAILED`, `RECONCILING` |
| `RECONCILING` | `CONFIRMED`, `FAILED` |
| `CONFIRMED`, `FAILED` | none (terminal) |

Anything else is `409 ILLEGAL_STATE_TRANSITION`. In practice the endpoints return an intent in `AWAITING_SIGNATURE`.

## Step 1: get an intent

Call one of the `…-intent` endpoints with an `Idempotency-Key`. The API checks the action against ledger state first, and returns `422`, `409` or `403` if the action would fail. An intent created in `AWAITING_SIGNATURE` is what the wallet signs.

## Step 2: sign

The wallet builds a transaction with **one** Soroban `invokeHostFunction` operation: contract `descriptor.contractId`, function `descriptor.function`, arguments in order. The source account is the signing account. The wallet signs it.

The web app does this in the browser: it loads the account sequence from Soroban RPC, builds exactly that one call, lets RPC simulation add the footprint, resource fee and auth entries, then asks Freighter to sign.

## Step 3: submit

`POST /v1/intents/{id}/submit`

```json
{ "signedXdr": "<base64 transaction envelope, 100 to 20000 characters>" }
```

Before forwarding anything, the API verifies the signed transaction:

* it is a normal transaction, **not** a fee-bump;
* its source account is the intent's actor;
* it has exactly one operation, a contract invocation;
* the contract id, function name, argument count and **each argument value** equal the descriptor;
* it carries a valid signature from the actor;
* it is on the configured network.

Any difference is `422 TX_MISMATCH` (or `TX_INVALID` if the XDR cannot be read). The error names what differs, for example `argument amount differs from the approved intent`.

If it passes, the API moves the intent to `SUBMITTED`, records the `txHash`, and sends the transaction to Soroban RPC. Definitive rejection moves it to `FAILED`. A network error or timeout leaves it `SUBMITTED`. Response `200`:

```json
{ "intent": { "state": "SUBMITTED", "txHash": "723048788e868fec3af088e0a19f3b50f561b0ae4a5af44f83734c14165c145c", "…": "…" } }
```

| Status | Code | When |
|---|---|---|
| 403 | `FORBIDDEN` | the caller is not the intent's actor |
| 404 | `NOT_FOUND` | unknown intent |
| 409 | `INTENT_NOT_SUBMITTABLE` | the intent is not `AWAITING_SIGNATURE` |
| 409 | `INTENT_ALREADY_SUBMITTED` | a different transaction was already submitted for this intent. Submitting the same one again returns the current state. |
| 422 | `INTENT_EXPIRED` | past `expiresAt`. The intent becomes `FAILED` (`EXPIRED_BEFORE_SIGNATURE`). Create a new one. |
| 422 | `TX_MISMATCH`, `TX_INVALID` | see above |
| 503 | indexer codes | the indexer is unavailable |

## Confirmation and reconciliation

An intent is only `CONFIRMED` when the **indexer shows the expected event** for that transaction hash (for example `funded` for a deposit). A background loop runs every 5 seconds (`RECONCILE_INTERVAL_MS`):

* a `SUBMITTED` intent whose event has appeared becomes `CONFIRMED`;
* if the chain reports the transaction failed, it becomes `FAILED` (`CHAIN_EXECUTION_FAILED`);
* if 120 seconds pass (`SUBMITTED_RECONCILE_AFTER_SECONDS`) with no answer, it becomes `RECONCILING`, and the loop keeps resolving it **by transaction hash**;
* an intent still `AWAITING_SIGNATURE` past `expiresAt` becomes `FAILED`.

A submitted transaction is never retried with changed parameters. This is why a lost HTTP response cannot cause a double payment.

## `GET /v1/intents/{id}`

Returns the intent. Callers who cannot see it get `404`.

## `GET /v1/circles/{id}/intents`

The caller's **own** intents in that circle, as `{ "intents": [ … ] }`.

## Why this design

* **No blind signing.** The wallet signs a call the user can inspect, and the API refuses anything else.
* **Early refusal.** A doomed call is stopped before a fee is paid.
* **Truthful status.** The app shows `SUBMITTED` and `RECONCILING` as they are. It does not claim success until the ledger says so.
