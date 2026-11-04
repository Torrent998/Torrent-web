# Real-wallet click-through (Freighter, Stellar Testnet)

This is the one thing the coding agent cannot do for you: Freighter is a browser extension with its own approval popups.
Nothing below has been run with a real Freighter yet. Everything on the backend side of it **has** been run against
the deployed Testnet contract (see `Torrent-contracts/docs/DEPLOYMENT.md`).

**Never paste a seed phrase or secret key anywhere (chat, issues, this repo).** If a step fails, copy the error text
only.

## 0. Start the three services (one terminal each, from the workspace folder)

```bash
# indexer (reads the chain; port 4002)
cd Torrent-indexer && npm run build && npm start
# api (port 4001; needs the indexer)
cd Torrent-api && npm run build && npm start
# web (port 4000)
cd Torrent-web && npx next dev -p 4000
```

`.env` files are not committed. Create them from each repo's `.env.example`:

| Repo | Values to set |
|---|---|
| `Torrent-indexer/.env` | `TORRENT_ESCROW_CONTRACT_ID=<contract id from Torrent-contracts/deployments/testnet.json>`, `CHAIN_START_LEDGER=<deployLedger from the same file>`, `PORT=4002` |
| `Torrent-api/.env` | `TORRENT_ESCROW_CONTRACT_ID=<same>`, `INDEXER_BASE_URL=http://localhost:4002`, `PORT=4001` |
| `Torrent-web/.env.local` | `NEXT_PUBLIC_API_BASE_URL=http://localhost:4001`, `NEXT_PUBLIC_STELLAR_NETWORK=testnet`, `NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org` |

Check: `http://localhost:4002/v1/status` shows `"status":"SYNCED"`.

## 1. Wallet setup

1. Install Freighter from the "Get Freighter" link on the site (or the Chrome Web Store / Firefox add-ons).
2. Create a **new** wallet just for this test. Write the recovery phrase on paper. Do not reuse a wallet that ever held real funds.
3. In Freighter settings choose the **Test Network** (passphrase `Test SDF Network ; September 2015`).
4. Copy your public address (starts with `G`). Fund it with test XLM at https://friendbot.stellar.org/?addr=YOUR_ADDRESS (or Freighter's "Fund with Friendbot" button).
5. Repeat steps 2-4 for a second wallet (the "member"). Use a second browser profile so both can stay connected.

## 2. Organizer: sign in and create the circle

6. Open `http://localhost:4000`, click **Launch app**, then **Sign in to Torrent**. Freighter asks you to sign a short
   message ("Signing proves you control this address. It does not authorize any payment."). Approve it.
   Expected: "Signed in as G...".
7. Click **New circle**. Circle name: anything. Pick max members, rounds and contribution. Use the Testnet native-XLM
   asset contract id as the token (it is in `Torrent-contracts/deployments/testnet-smoke.json` under `token`). Create it.
   Expected: the circle page shows **No on-chain pool / Not bound** and a **Rules hash**.
8. Create the on-chain pool. Either:
   - API (new): `POST /v1/circles/{id}/pool-intent` returns a signing request; the web UI does **not** have a button for
     it yet, so use the stellar-cli path instead, or
   - stellar-cli (works today), with a funded Testnet key alias `me` for the organizer's address:
     ```bash
     stellar contract invoke --id <CONTRACT_ID> --source-account me --network testnet -- create_pool \
       --controller <ORGANIZER_G> --token <TOKEN_ID> --membership_policy_hash <RULES_HASH_FROM_THE_PAGE>
     ```
   Expected within about a minute: the page flips from **Not bound** to bound, with a pool number.

## 3. Member joins (off-chain invitation, then on-chain)

9. Organizer: **Create invitation**, label it, copy the **Invitation code** (shown once).
10. Member (second profile): sign in as in step 6, open **Invitations**, paste the code, **Continue**.
11. Joining the pool on-chain needs two calls today (no web buttons yet). Organizer allows, member joins:
    ```bash
    stellar contract invoke --id <CONTRACT_ID> --source-account organizer-alias --network testnet -- allow_member --pool_id <POOL> --member <MEMBER_G>
    stellar contract invoke --id <CONTRACT_ID> --source-account member-alias --network testnet -- join_pool --pool_id <POOL> --member <MEMBER_G> --signed_policy_hash <RULES_HASH>
    ```

## 4. Deposit, right, transfer, claim

12. Organizer: **Contribute** / **Amount to deposit** = `10000000` (1 XLM in stroops), **Request signature**. Freighter shows
    the exact contract call (`deposit`) - check the pool number and amount, approve. Expected: intent goes
    SUBMITTED then CONFIRMED, and **Funded in escrow** rises. "Fully backed" stays on.
13. Issue a right to the member (CLI today; API `POST /v1/circles/{id}/rights-intent` exists, no web button yet):
    ```bash
    stellar contract invoke --id <CONTRACT_ID> --source-account organizer-alias --network testnet -- issue_right \
      --pool_id <POOL> --owner <MEMBER_G> --amount 6000000 --maturity <UNIX_SECONDS_10_MIN_FROM_NOW> --policy_hash <RULES_HASH>
    ```
    Expected: the member sees it under **Payout rights**.
14. Member: on the right, **Request signature** to propose a transfer to the organizer (the exact call `propose_transfer` is
    shown in Freighter); approve. Organizer: approve the incoming transfer (it creates the `accept_transfer` request),
    sign it. Expected: the right's owner changes after the indexer confirms.
15. Wait until the maturity time passes. The current owner clicks **Request signature** on the right to claim
    (`claim`). Expected: state becomes claimed; funded/claimed totals update.
16. Member: **Request leave signature** (only works when you own no unclaimed right). Expected: member leaves the pool.

## 5. What to send back if something fails

- The page, the step number, and the on-screen error text.
- The Freighter popup text (screenshot is fine, but make sure no recovery phrase is visible).
- `curl http://localhost:4002/v1/status` and `curl http://localhost:4001/v1/contract` output.
- API log lines around the failure (they contain no secrets).

Hand the error text to a coding agent in this workspace and tell it to read `AGENTS.md`; it will reproduce the problem
in a test first and add a regression test with the fix.

## Known gaps (so you are not surprised)

- The web UI has no buttons for create pool, join pool, issue right or close pool; the API now has signing requests for
  create pool, issue right and close pool, but the web does not call them yet. Joining the pool has neither.
- Freighter signing through `@stellar/freighter-api` 6.0.1 has never been exercised by anyone; fixes found here are expected.
