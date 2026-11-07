import { Contract, TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import type { Intent } from "@/lib/api/schemas";
import { toScVal } from "./scval";
import { WalletError, type WalletAdapter } from "./types";

interface FreighterError { code: number; message: string }
/**
 * The subset of `@stellar/freighter-api` (v6) this app uses. Injected, so tests can stand in for
 * the browser extension; production loads the real package lazily.
 */
export interface FreighterApi {
  isConnected(): Promise<{ isConnected: boolean; error?: FreighterError }>;
  requestAccess(): Promise<{ address: string; error?: FreighterError }>;
  getNetworkDetails(): Promise<{ network: string; networkPassphrase: string; sorobanRpcUrl?: string; error?: FreighterError }>;
  signMessage(message: string, opts: { networkPassphrase?: string; address?: string }): Promise<{ signedMessage: string | Uint8Array | null; signerAddress: string; error?: FreighterError }>;
  signTransaction(xdr: string, opts: { networkPassphrase?: string; address?: string }): Promise<{ signedTxXdr: string; signerAddress: string; error?: FreighterError }>;
}

/** Turns an intent's contract call into an unsigned, simulated and fee-prepared transaction (base64 XDR). */
export interface TxPreparer {
  prepare(intent: Intent, source: string, networkPassphrase: string): Promise<string>;
}

/**
 * Real preparer: loads the account sequence from Soroban RPC, builds exactly the intent's single
 * contract invocation and lets RPC simulation add the footprint, resource fee and auth entries.
 * STATUS: compiled and unit-tested with a mocked RPC; not yet run with a real Freighter wallet.
 */
export class RpcTxPreparer implements TxPreparer {
  private readonly server: rpc.Server;
  constructor(rpcUrl: string) { this.server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith("http://localhost") }); }
  async prepare(intent: Intent, source: string, networkPassphrase: string): Promise<string> {
    const d = intent.descriptor;
    const account = await this.server.getAccount(source);
    const tx = new TransactionBuilder(account, { fee: "100000", networkPassphrase })
      .addOperation(new Contract(d.contractId).call(d.function, ...d.args.map(toScVal)))
      .setTimeout(300).build();
    return (await this.server.prepareTransaction(tx)).toXDR();
  }
}

const DECLINED = /declin|reject|denied|cancel/i;
function fail(e: FreighterError | undefined, what: string): void {
  if (!e) return;
  throw new WalletError(DECLINED.test(e.message) ? "CANCELLED" : "UNAVAILABLE", `${what}: ${e.message}`);
}

/** Freighter returns the SEP-53 signature as base64 text (v5+) or raw bytes (v4). Normalize to base64. */
export function signatureToBase64(sig: string | Uint8Array | null): string {
  if (sig === null) throw new WalletError("CANCELLED", "Freighter returned no signature.");
  const bytes = typeof sig === "string" ? Buffer.from(sig, "base64") : Buffer.from(sig);
  if (bytes.length !== 64) throw new WalletError("INVALID", "Freighter returned a malformed signature.");
  return bytes.toString("base64");
}

/** Feature detection: true only if the Freighter extension answers. Never throws; times out quickly. */
export async function detectFreighter(api: Pick<FreighterApi, "isConnected">, timeoutMs = 4000): Promise<boolean> {
  try {
    const r = await Promise.race([api.isConnected(), new Promise<null>((res) => setTimeout(() => res(null), timeoutMs))]);
    return !!r && !r.error && r.isConnected;
  } catch { return false; }
}

export const loadFreighterApi = async (): Promise<FreighterApi> => (await import("@stellar/freighter-api")).default as unknown as FreighterApi;

/**
 * Browser-wallet adapter for Freighter. Keys never leave the extension: it signs the login
 * message (SEP-53) and the prepared transaction for exactly the intent's contract call. Fails
 * closed if Freighter is on another network or signs with another account.
 */
export class FreighterWalletAdapter implements WalletAdapter {
  readonly id = "freighter";
  readonly label = "Freighter";
  readonly isTestAdapter = false;
  private address: string | null = null;
  constructor(private readonly api: FreighterApi, private readonly preparer: TxPreparer, private readonly expectedPassphrase: string) {}

  private async checkNetwork(): Promise<void> {
    const n = await this.api.getNetworkDetails();
    fail(n.error, "Could not read Freighter's network");
    if (n.networkPassphrase !== this.expectedPassphrase) {
      throw new WalletError("INVALID", `Freighter is set to ${n.network || "another network"}. Switch it to Testnet and try again.`);
    }
  }

  async connect() {
    if (!(await detectFreighter(this.api))) throw new WalletError("UNAVAILABLE", "Freighter is not installed or not enabled in this browser.");
    const r = await this.api.requestAccess();
    fail(r.error, "Freighter did not share an account");
    if (!/^G[A-Z2-7]{55}$/.test(r.address)) throw new WalletError("INVALID", "Freighter returned no public address.");
    await this.checkNetwork();
    this.address = r.address;
    return { address: r.address };
  }

  private mine(): string {
    if (!this.address) throw new WalletError("UNAVAILABLE", "Connect Freighter first.");
    return this.address;
  }

  async signMessage(message: string) {
    const address = this.mine();
    const r = await this.api.signMessage(message, { networkPassphrase: this.expectedPassphrase, address });
    fail(r.error, "Freighter did not sign the login message");
    if (r.signerAddress && r.signerAddress !== address) throw new WalletError("INVALID", "Freighter signed with a different account.");
    return signatureToBase64(r.signedMessage);
  }

  async signIntent(intent: Intent, networkPassphrase: string) {
    const address = this.mine();
    if (networkPassphrase !== this.expectedPassphrase) throw new WalletError("INVALID", "Network mismatch between the app and the wallet adapter.");
    await this.checkNetwork();
    let unsigned: string;
    try { unsigned = await this.preparer.prepare(intent, address, networkPassphrase); }
    catch (e) { throw new WalletError("UNAVAILABLE", `Could not prepare the transaction (simulation failed or RPC unreachable): ${e instanceof Error ? e.message : "unknown error"}`); }
    const r = await this.api.signTransaction(unsigned, { networkPassphrase, address });
    fail(r.error, "Freighter did not sign the transaction");
    if (r.signerAddress && r.signerAddress !== address) throw new WalletError("INVALID", "Freighter signed with a different account.");
    // Never forward something other than what was prepared: same envelope, plus a signature.
    const signed = TransactionBuilder.fromXDR(r.signedTxXdr, networkPassphrase);
    const before = TransactionBuilder.fromXDR(unsigned, networkPassphrase);
    if (Buffer.from(signed.hash()).toString("hex") !== Buffer.from(before.hash()).toString("hex")) throw new WalletError("INVALID", "Freighter returned a different transaction than the one prepared.");
    return r.signedTxXdr;
  }
}

export const stellarRpcUrl = (): string => process.env["NEXT_PUBLIC_STELLAR_RPC_URL"] ?? "https://soroban-testnet.stellar.org";
