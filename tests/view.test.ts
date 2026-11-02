import { describe, expect, it } from "vitest";
import { coverageView, describeDescriptor, intentStatus, rightRow, secondsLeft } from "@/features/view";
import type { Coverage, Right } from "@/lib/api/schemas";
import { INTENT_STATES } from "@/lib/api/schemas";

const bound = (over: Partial<Extract<Coverage, { bound: true }>> = {}): Coverage => ({
  circleId: "c", bound: true, poolId: "1", totals: { funded: "10000000000", reserved: "6000000000", claimed: "0", withdrawn: "0" },
  unreserved: "4000000000", fullyBacked: true, poolStatus: "Active", indexerStatus: "SYNCED", asOfLedger: 500, lagLedgers: 0, observedAt: "x", ...over,
});

describe("intentStatus never overstates settlement", () => {
  it("only CONFIRMED is good; SUBMITTED/RECONCILING are pending and non-final", () => {
    for (const s of INTENT_STATES) {
      const v = intentStatus(s);
      expect(v.tone === "good", s).toBe(s === "CONFIRMED");
    }
    expect(intentStatus("SUBMITTED")).toMatchObject({ tone: "pending", final: false });
    expect(intentStatus("SUBMITTED").label.toLowerCase()).toContain("not yet confirmed");
    expect(intentStatus("RECONCILING").final).toBe(false);
    expect(intentStatus("FAILED").final).toBe(true);
    expect(intentStatus("AWAITING_SIGNATURE").explain).toMatch(/nothing has happened on-chain/i);
  });
});

describe("coverageView", () => {
  it("unbound pool shows no numbers (never invents coverage)", () => {
    const v = coverageView({ circleId: "c", bound: false });
    expect(v.numbers).toBeNull();
    expect(v.headline).toMatch(/no on-chain pool/i);
  });
  it("formats exact amounts and says fully backed only when SYNCED and not behind", () => {
    const v = coverageView(bound());
    expect(v.tone).toBe("good");
    expect(v.numbers).toContainEqual({ label: "Unreserved", value: "400" });
    expect(v.freshness).toContain("ledger 500");
  });
  it("downgrades to warning when the indexer lags and to bad when reconciling or underbacked", () => {
    expect(coverageView(bound({ lagLedgers: 3, indexerStatus: "SYNCING" })).tone).toBe("warn");
    expect(coverageView(bound({ lagLedgers: 3 })).detail.join(" ")).toMatch(/3 ledger/);
    expect(coverageView(bound({ indexerStatus: "RECONCILING" })).tone).toBe("bad");
    expect(coverageView(bound({ fullyBacked: false })).tone).toBe("bad");
    const paused = coverageView(bound({ poolStatus: "Paused" }));
    expect(paused.tone).toBe("warn");
    expect(paused.detail.join(" ")).toMatch(/claims still work/);
  });
});

describe("rightRow", () => {
  const r: Right = { rightId: "5", poolId: "1", amount: "1000000000", owner: "GME", maturity: 2000, state: "Issued", pendingTransfer: null, issuedAtLedger: 1, claimedAtLedger: null };
  const before = new Date(1000 * 1000); const after = new Date(3000 * 1000);
  it("owner can propose transfer any time, claim only after maturity", () => {
    expect(rightRow(r, "GME", before)).toMatchObject({ canProposeTransfer: true, canClaim: false, ownedByMe: true });
    expect(rightRow(r, "GME", after)).toMatchObject({ canProposeTransfer: true, canClaim: true });
  });
  it("others, claimed rights and open proposals offer no actions", () => {
    expect(rightRow(r, "GOTHER", after)).toMatchObject({ canProposeTransfer: false, canClaim: false, ownedByMe: false });
    expect(rightRow(r, null, after).canClaim).toBe(false);
    expect(rightRow({ ...r, state: "Claimed" }, "GME", after)).toMatchObject({ canProposeTransfer: false, canClaim: false, note: "Paid out" });
    expect(rightRow({ ...r, pendingTransfer: "9" }, "GME", before)).toMatchObject({ canProposeTransfer: false, note: "Transfer proposal open" });
  });
});

describe("misc", () => {
  it("secondsLeft never negative", () => {
    expect(secondsLeft("2026-01-01T00:10:00Z", new Date("2026-01-01T00:00:00Z"))).toBe(600);
    expect(secondsLeft("2026-01-01T00:10:00Z", new Date("2026-02-01T00:00:00Z"))).toBe(0);
  });
  it("descriptor text shows exact base units next to the human amount", () => {
    const t = describeDescriptor({ descriptor: { contractId: "C1", function: "deposit", args: [{ name: "amount", type: "i128", value: "15000000" }] } });
    expect(t).toContain("1.5 (15000000 base units)");
  });
});
