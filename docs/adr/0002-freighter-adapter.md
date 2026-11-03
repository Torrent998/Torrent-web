# ADR 0002 — Freighter browser-wallet adapter

Status: accepted.

## Decisions
1. Freighter is a third `WalletAdapter` next to the manual and test adapters. It is offered only when
   `@stellar/freighter-api` reports the extension connected within 1.5 s (`detectFreighter`); otherwise the UI says
   it was not detected and keeps the sign-and-paste flow.
2. The package is loaded lazily and the extension API is injected, so tests use a labelled stand-in that signs with
   a throwaway keypair. jsdom gets a global "not installed" mock.
3. Login uses Freighter's SEP-53 `signMessage`; the signature is normalized to base64 (v4 bytes or v5+ text).
4. Intents: `RpcTxPreparer` loads the account from Soroban RPC (`NEXT_PUBLIC_STELLAR_RPC_URL`), builds exactly the
   intent's single invocation and lets `prepareTransaction` add footprint, fees and auth. torrent-api still verifies
   the signed envelope against the approved intent before submission.
5. Fail closed: wrong Freighter network, a different signer, or a returned transaction whose hash differs from the
   prepared one is refused before anything reaches the API.

## Not done
Never run against live Testnet (no deployment exists). Other wallets (e.g. via Stellar Wallets Kit) are not supported.
