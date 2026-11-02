// @vitest-environment node
import { Keypair, Networks, Transaction, TransactionBuilder, scValToNative } from "@stellar/stellar-sdk";
import { describe, expect, it, vi } from "vitest";
import type { Intent } from "@/lib/api/schemas";
import { ManualWalletAdapter } from "@/lib/wallet/manual";
import { TestWalletAdapter } from "@/lib/wallet/test-wallet";
import { WalletError } from "@/lib/wallet/types";

const kp = Keypair.random();
const CONTRACT = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHK3M";
const intent: Intent = {
  id: "int_1", schemaVersion: 1, requestId: "r", kind: "FUNDING", circleId: "c", state: "AWAITING_SIGNATURE",
  descriptor: { contractId: CONTRACT, function: "deposit", args: [
    { name: "pool_id", type: "u64", value: "1" }, { name: "from", type: "address", value: kp.publicKey() }, { name: "amount", type: "i128", value: "25000000" },
  ] }, txHash: null, failureReason: null, verifiedAtLedger: 1, expiresAt: "x", createdAt: "x", updatedAt: "x",
};

describe("TestWalletAdapter (labeled test adapter)", () => {
  it("is labeled as a test adapter and exposes only the public address", async () => {
    const w = new TestWalletAdapter(kp);
    expect(w.isTestAdapter).toBe(true);
    expect(w.label).toMatch(/TEST WALLET/);
    expect(await w.connect()).toEqual({ address: kp.publicKey() });
    expect(JSON.stringify(await w.connect())).not.toContain(kp.secret());
  });
  it("login signature verifies as SEP-53 against the public key", async () => {
    const w = new TestWalletAdapter(kp);
    const sig = await w.signMessage("hello\nworld");
    expect(kp.verifyMessage("hello\nworld", Buffer.from(sig, "base64"))).toBe(true);
    expect(kp.verifyMessage("hello\nworld!", Buffer.from(sig, "base64"))).toBe(false);
  });
  it("signs a single contract-invocation tx that matches the descriptor exactly", async () => {
    const xdr = await new TestWalletAdapter(kp).signIntent(intent, Networks.TESTNET);
    const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET) as Transaction;
    expect(tx.source).toBe(kp.publicKey());
    expect(tx.operations).toHaveLength(1);
    const op = tx.operations[0]!;
    if (op.type !== "invokeHostFunction" || op.func.type !== "hostFunctionTypeInvokeContract") throw new Error("not a contract call");
    const ic = op.func.invokeContract;
    expect(ic.functionName.toString()).toBe("deposit");
    expect(ic.args.map((a) => String(scValToNative(a)))).toEqual(["1", kp.publicKey(), "25000000"]);
    expect(tx.signatures.some((s) => kp.verify(tx.hash(), s.signature))).toBe(true);
  });
});

describe("ManualWalletAdapter", () => {
  it("rejects a non-public address (e.g. a secret seed) before anything else", async () => {
    await expect(new ManualWalletAdapter(vi.fn(), "S" + "A".repeat(55)).connect()).rejects.toMatchObject({ code: "INVALID" });
    await expect(new ManualWalletAdapter(vi.fn(), kp.publicKey()).connect()).resolves.toEqual({ address: kp.publicKey() });
  });
  it("asks the user for the signature / signed XDR with the exact thing to sign, and trims input", async () => {
    const ask = vi.fn().mockResolvedValueOnce("  c2ln\n").mockResolvedValueOnce("  AAAA  ");
    const w = new ManualWalletAdapter(ask, kp.publicKey());
    expect(await w.signMessage("msg")).toBe("c2ln");
    expect(ask.mock.calls[0]![0]).toMatchObject({ context: "msg" });
    expect(await w.signIntent(intent)).toBe("AAAA");
    expect(ask.mock.calls[1]![0].context).toContain("deposit(");
    expect(ask.mock.calls[1]![0].context).toContain("2.5 (25000000 base units)");
  });
  it("cancelling surfaces a CANCELLED WalletError", async () => {
    const w = new ManualWalletAdapter(vi.fn().mockResolvedValue(null), kp.publicKey());
    await expect(w.signMessage("m")).rejects.toBeInstanceOf(WalletError);
    await expect(w.signIntent(intent)).rejects.toMatchObject({ code: "CANCELLED" });
  });
});
