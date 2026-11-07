# Building, testing and deploying the contract

All commands run from the root of [Torrent-contracts](https://github.com/Torrent998/Torrent-contracts).

## Prerequisites

| Tool | Version | Used for |
|---|---|---|
| Rust (stable) with the `wasm32v1-none` target | edition per `Cargo.toml` | building the contract |
| `stellar-cli` | 25.2 or newer. 27.1.0 was used for the Testnet deployment. | build, deploy and invoke |
| `curl`, `jq`, `bash` | any | the deploy and smoke scripts |

```bash
rustup target add wasm32v1-none
stellar --version
```

{% hint style="info" %}
On Windows with the GNU Rust toolchain the contract can fail to link with `export ordinal too large`. Use the MSVC toolchain instead, for example `RUSTUP_TOOLCHAIN=stable-x86_64-pc-windows-msvc`. This is how the Windows runs in this project were done.
{% endhint %}

## Check (same as CI)

```bash
./scripts/check.sh
./scripts/check-bindings.sh
```

`check.sh` runs `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, builds the release wasm, then `cargo test --all`. The wasm is built first because the governance test installs it as a real upgrade target. `check-bindings.sh` checks that `bindings/*.v2.json` match the code.

## Tests

57 tests in 7 files, all passing when last run:

| File | Tests | What it covers |
|---|---|---|
| `abi_surface.rs` | 1 | the public functions match `bindings/abi.v2.json` |
| `authz.rs` | 4 | the right account must sign each call |
| `escrow_flow.rs` | 24 | happy path; backing limit; issue validation; old owner cannot claim; double claim; two-signature transfers; expired and cancelled offers; deposit rules; membership; withdraw only unreserved; pause never blocks claims; pool isolation |
| `events.rs` | 5 | event shapes and the golden stream `bindings/stream.v2.json` |
| `governance.rs` | 7 | admin rotation, timelocked upgrades, locking, admin has no pool power |
| `lifecycle.rs` | 14 | closing, member removal and leaving, controller rotation, maturity rules, replay protection, counters |
| `properties.rs` | 2 | property tests of the backing invariant and of `open_rights` over random operation sequences (48 and 32 cases) |

## Build the wasm

```bash
./scripts/build.sh      # uses `stellar contract build --package torrent-escrow`
```

The output is `target/wasm32v1-none/release/torrent_escrow.wasm`. The hash of the deployed Testnet build is `9dd206c4b7e4f673dd6006da9c45efe3d8b0ad5e1155d8e3b957f855f330f264`. It is the sha256 of the file built with `stellar contract build`, which applies spec shaking that `soroban-sdk` 29 expects.

{% hint style="warning" %}
The wasm that CI builds with plain `cargo` has a **different** hash, because it is not spec-shaken. Do not compare a CI artifact to the deployed hash. Reproducible builds are not claimed.
{% endhint %}

## Deploy to Testnet

```bash
stellar keys generate --fund torrent-deployer --network testnet
STELLAR_SOURCE_ALIAS=torrent-deployer ./scripts/deploy-testnet.sh
```

The script:

1. refuses any network other than Testnet and checks the RPC reports the Testnet passphrase;
2. refuses to run if the contract sources have uncommitted changes;
3. builds, uploads the wasm and deploys it with `--admin`, calling the constructor;
4. checks `abi_version() == 2`;
5. writes `deployments/testnet.json` with the contract id, wasm hash, admin, git commit, deploy transaction and ledger.

Set `TORRENT_ADMIN_ADDRESS` to make someone other than the deployer the upgrade admin. The real output of this run is in `deployments/testnet.json`:

```json
{
  "network": "testnet",
  "contractId": "CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG",
  "wasmHash": "9dd206c4b7e4f673dd6006da9c45efe3d8b0ad5e1155d8e3b957f855f330f264",
  "abiVersion": 2,
  "admin": "GAE3F3TYRELLL34IM2N74QG3PXWZUYDMCKBTPDWPN7ZNHBVTXWNC7ZNT",
  "deployTx": "653b9c6d026720e5c8f389e0347b21a7d369706f19baf9313f0a4947c4b2ac0f",
  "deployLedger": 5553711,
  "deployedAt": "2026-11-04T11:35:20Z"
}
```

(trimmed). The transaction is on [Stellar Expert](https://stellar.expert/explorer/testnet/tx/653b9c6d026720e5c8f389e0347b21a7d369706f19baf9313f0a4947c4b2ac0f).

## Smoke test

```bash
./scripts/smoke-testnet.sh
```

It creates and funds the identities `torrent-controller`, `torrent-alice` and `torrent-bob`, then drives the whole lifecycle with real transactions and writes every hash to `deployments/testnet-smoke.json`. It also asserts that seven things are **refused** (unbacked issue, offer past maturity, replayed accept, early claim, leaving while owning a right, double claim, deposit into a closed pool), resolving error names to codes from the contract's own error enum.

It uses generous time windows (`SMOKE_MATURITY_SECS`, default 420 seconds) because each Testnet call from a slow connection can take 20 to 40 seconds, and an offer has to land before the right matures. Transport errors are retried. Contract refusals are never retried.

The run is described step by step in the [worked example](../concepts/worked-example.md).

## After deploying

1. Give the indexer `TORRENT_ESCROW_CONTRACT_ID` and `CHAIN_START_LEDGER` (the `deployLedger`).
2. Give the API the same `TORRENT_ESCROW_CONTRACT_ID`.
3. Commit `deployments/testnet.json` and the smoke output. They contain only public data.

Never commit keys, seeds or `.env` files.
