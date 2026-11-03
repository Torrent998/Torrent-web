// @vitest-environment node
import { Account, Contract, Keypair, Networks, Transaction, TransactionBuilder, rpc, scValToNative } from "@stellar/stellar-sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Intent } from "@/lib/api/schemas";
import { FreighterWalletAdapter, RpcTxPreparer, detectFreighter, signatureToBase64, type FreighterApi, type TxPreparer } from "@/lib/wallet/freighter";
import { toScVal } from "@/lib/wallet/scval";
import { WalletError } from "@/lib/wallet/types";

const kp = Keypair.random();
const CONTRACT = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHK3M";
const PASS = Networks.TESTNET;
const intent: Intent = {
  id: "int_1", schemaVersion: 1, requestId: "r", kind: "TRANSFER_CANCEL", circleId: "c", state: "AWAITING_SIGNATURE",
  descriptor: { contractId: CONTRACT, function: "cancel_transfer", args: [{ name: "transfer_id", type: "u64", value: "77" }] },
  txHash: null, failureReason: null, verifiedAtLedger: 1, expiresAt: "x", createdAt: "x", updatedAt: "x",
};

/** Stand-in for the Freighter extension: holds a key the app never sees and signs like Freighter. */
function fakeFreighter(over: Partial<FreighterApi> = {}, network: { network: string; networkPassphrase: string } = { network: "TESTNET", networkPassphrase: PASS }): FreighterApi & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    isConnected: async () => { calls.push("isConnected"); return { isConnected: true }; },
    requestAccess: async () => { calls.push("requestAccess"); return { address: kp.publicKey() }; },
    getNetworkDetails: async () => ({ ...network }),
    signMessage: async (m, o) => { calls.push(`signMessage:${o.address}`); return { signedMessage: Buffer.from(kp.signMessage(m)).toString("base64"), signerAddress: kp.publicKey() }; },
    signTransaction: async (x, o) => {
      calls.push(`signTransaction:${o.networkPassphrase}`);
      const tx = TransactionBuilder.fromXDR(x, o.networkPassphrase!) as Transaction;
      tx.sign(kp);
      return { signedTxXdr: tx.toXDR(), signerAddress: kp.publicKey() };
    },
    ...over,
  };
}

/** Builds the unsigned invocation without RPC (sequence placeholder), like a prepared tx would look. */
const localPreparer: TxPreparer = {
  async prepare(i, source, pass) {
    return new TransactionBuilder(new Account(source, "41"), { fee: "100", networkPassphrase: pass })
      .addOperation(new Contract(i.descriptor.contractId).call(i.descriptor.function, ...i.descriptor.args.map(toScVal)))
      .setTimeout(300).build().toXDR();
  },
};

const codeOf = async (p: Promise<unknown>) => { try { await p; } catch (e) { return e instanceof WalletError ? e.code : "OTHER"; } return "OK"; };

describe("detectFreighter (feature detection)", () => {
  it("is true only when the extension answers connected", async () => {
    expect(await detectFreighter(fakeFreighter())).toBe(true);
    expect(await detectFreighter({ isConnected: async () => ({ isConnected: false }) })).toBe(false);
    expect(await detectFreighter({ isConnected: async () => ({ isConnected: true, error: { code: -1, message: "x" } }) })).toBe(false);
    expect(await detectFreighter({ isConnected: async () => { throw new Error("no extension"); } })).toBe(false);
    expect(await detectFreighter({ isConnected: () => new Promise(() => {}) }, 20)).toBe(false); // never answers
  });
});

describe("FreighterWalletAdapter", () => {
  it("connects on Testnet and exposes only the public address", async () => {
    const f = fakeFreighter();
    const w = new FreighterWalletAdapter(f, localPreparer, PASS);
    expect(w.isTestAdapter).toBe(false);
    expect(await w.connect()).toEqual({ address: kp.publicKey() });
    expect(JSON.stringify(await w.connect())).not.toContain(kp.secret());
  });

  it("fails closed when missing, declined, on another network or returning no address", async () => {
    const mk = (over: Partial<FreighterApi>, net?: { network: string; networkPassphrase: string }) => new FreighterWalletAdapter(fakeFreighter(over, net), localPreparer, PASS).connect();
    expect(await codeOf(mk({ isConnected: async () => ({ isConnected: false }) }))).toBe("UNAVAILABLE");
    expect(await codeOf(mk({ requestAccess: async () => ({ address: "", error: { code: -4, message: "The user rejected this request." } }) }))).toBe("CANCELLED");
    expect(await codeOf(mk({}, { network: "PUBLIC", networkPassphrase: Networks.PUBLIC }))).toBe("INVALID");
    expect(await codeOf(mk({ requestAccess: async () => ({ address: "" }) }))).toBe("INVALID");
  });

  it("login signature is SEP-53 for the connected account (string or bytes from the extension)", async () => {
    const w = new FreighterWalletAdapter(fakeFreighter(), localPreparer, PASS);
    expect(await codeOf(w.signMessage("hi"))).toBe("UNAVAILABLE"); // not connected yet
    await w.connect();
    const sig = await w.signMessage("Torrent login\nnonce=1");
    expect(kp.verifyMessage("Torrent login\nnonce=1", Buffer.from(sig, "base64"))).toBe(true);
    const bytes = new FreighterWalletAdapter(fakeFreighter({ signMessage: async (m) => ({ signedMessage: new Uint8Array(kp.signMessage(m)), signerAddress: kp.publicKey() }) }), localPreparer, PASS);
    await bytes.connect();
    expect(kp.verifyMessage("x", Buffer.from(await bytes.signMessage("x"), "base64"))).toBe(true);
  });

  it("rejects a signature from another account or a malformed one", async () => {
    const other = Keypair.random();
    const w = new FreighterWalletAdapter(fakeFreighter({ signMessage: async (m) => ({ signedMessage: Buffer.from(other.signMessage(m)).toString("base64"), signerAddress: other.publicKey() }) }), localPreparer, PASS);
    await w.connect();
    expect(await codeOf(w.signMessage("m"))).toBe("INVALID");
    expect(() => signatureToBase64("AAAA")).toThrow(WalletError);
    expect(() => signatureToBase64(null)).toThrow(/no signature/);
  });

  it("signs exactly the intent's contract call on the app's network", async () => {
    const f = fakeFreighter();
    const w = new FreighterWalletAdapter(f, localPreparer, PASS);
    await w.connect();
    const xdr = await w.signIntent(intent, PASS);
    const tx = TransactionBuilder.fromXDR(xdr, PASS) as Transaction;
    expect(tx.source).toBe(kp.publicKey());
    expect(tx.operations).toHaveLength(1);
    const op = tx.operations[0]!;
    if (op.type !== "invokeHostFunction" || op.func.type !== "hostFunctionTypeInvokeContract") throw new Error("not a contract call");
    const ic = op.func.invokeContract;
    expect(ic.functionName.toString()).toBe("cancel_transfer");
    expect(ic.args.map((a) => scValToNative(a))).toEqual([77n]);
    expect(tx.signatures.some((s) => kp.verify(tx.hash(), s.signature))).toBe(true);
    expect(f.calls).toContain(`signTransaction:${PASS}`);
  });

  it("refuses a swapped transaction, a declined signature, a failed preparation or a network switch", async () => {
    const swap = fakeFreighter({
      signTransaction: async (_x, o) => {
        const evil = new TransactionBuilder(new Account(kp.publicKey(), "41"), { fee: "100", networkPassphrase: o.networkPassphrase! })
          .addOperation(new Contract(CONTRACT).call("claim", ...[{ name: "right_id", type: "u64" as const, value: "1" }].map(toScVal))).setTimeout(300).build();
        evil.sign(kp);
        return { signedTxXdr: evil.toXDR(), signerAddress: kp.publicKey() };
      },
    });
    const run = async (f: FreighterApi, p: TxPreparer = localPreparer, pass = PASS) => { const w = new FreighterWalletAdapter(f, p, PASS); await w.connect(); return w.signIntent(intent, pass); };
    expect(await codeOf(run(swap))).toBe("INVALID");
    expect(await codeOf(run(fakeFreighter({ signTransaction: async () => ({ signedTxXdr: "", signerAddress: "", error: { code: -4, message: "User declined access" } }) })))).toBe("CANCELLED");
    expect(await codeOf(run(fakeFreighter(), { prepare: async () => { throw new Error("simulation failed"); } }))).toBe("UNAVAILABLE");
    expect(await codeOf(run(fakeFreighter(), localPreparer, Networks.PUBLIC))).toBe("INVALID");
    let n = 0;
    const flips = fakeFreighter({ getNetworkDetails: async () => (n++ === 0 ? { network: "TESTNET", networkPassphrase: PASS } : { network: "PUBLIC", networkPassphrase: Networks.PUBLIC }) });
    expect(await codeOf(run(flips))).toBe("INVALID");
  });
});

describe("RpcTxPreparer (Soroban RPC mocked)", () => {
  afterEach(() => vi.restoreAllMocks());
  it("loads the account, builds the single invocation and returns the RPC-prepared envelope", async () => {
    const getAccount = vi.spyOn(rpc.Server.prototype, "getAccount").mockResolvedValue(new Account(kp.publicKey(), "100"));
    const prepare = vi.spyOn(rpc.Server.prototype, "prepareTransaction").mockImplementation(async (tx) => tx as Transaction);
    const xdr = await new RpcTxPreparer("https://soroban-testnet.stellar.org").prepare(intent, kp.publicKey(), PASS);
    expect(getAccount).toHaveBeenCalledWith(kp.publicKey());
    expect(prepare).toHaveBeenCalledOnce();
    const tx = TransactionBuilder.fromXDR(xdr, PASS) as Transaction;
    expect(tx.sequence).toBe("101");
    expect(tx.operations).toHaveLength(1);
  });
});
