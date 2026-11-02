import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CoveragePanel } from "@/components/coverage-panel";
import { IntentPanel } from "@/components/intent-panel";
import { RightsTable } from "@/components/rights-table";
import { SessionGate } from "@/components/session-gate";
import { ApiClient, ApiError } from "@/lib/api/client";
import type { Intent, Right } from "@/lib/api/schemas";
import { SessionProvider } from "@/lib/session";

const base: Intent = {
  id: "int_1", schemaVersion: 1, requestId: "r", kind: "FUNDING", circleId: "c", state: "AWAITING_SIGNATURE",
  descriptor: { contractId: "CABC", function: "deposit", args: [{ name: "amount", type: "i128", value: "15000000" }] },
  txHash: null, failureReason: null, verifiedAtLedger: 1, expiresAt: "2026-03-01T00:15:00.000Z", createdAt: "x", updatedAt: "x",
};
const now = () => new Date("2026-03-01T00:00:00.000Z");
const fakeClient = (over: Partial<Record<"submitIntent" | "getIntent", unknown>> = {}) =>
  ({ submitIntent: vi.fn(), getIntent: vi.fn(), ...over }) as unknown as ApiClient;
const LONG = "A".repeat(120);

describe("IntentPanel", () => {
  it("shows what will be signed and that nothing happened on-chain yet", () => {
    render(<IntentPanel intent={base} client={fakeClient()} now={now} />);
    expect(screen.getByText("Needs your signature")).toBeInTheDocument();
    expect(screen.getByText(/nothing has happened on-chain/i)).toBeInTheDocument();
    expect(screen.getByText(/deposit\(amount = 1\.5 \(15000000 base units\)\)/)).toBeInTheDocument();
    expect(screen.getByText(/15m 0s/)).toBeInTheDocument();
  });

  it("submits the pasted XDR and then shows SUBMITTED as not yet confirmed (not as success)", async () => {
    const submitted: Intent = { ...base, state: "SUBMITTED", txHash: "ab".repeat(32) };
    const client = fakeClient({ submitIntent: vi.fn().mockResolvedValue({ intent: submitted }) });
    render(<IntentPanel intent={base} client={client} now={now} pollMs={1e9} />);
    const btn = screen.getByRole("button", { name: /submit signed transaction/i });
    expect(btn).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/signed transaction/i), LONG);
    await userEvent.click(btn);
    expect(client.submitIntent).toHaveBeenCalledWith("int_1", LONG);
    expect(await screen.findByText("Submitted, not yet confirmed")).toBeInTheDocument();
    expect(screen.queryByText(/confirmed on-chain/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Transaction: abab/)).toBeInTheDocument();
  });

  it("surfaces a server refusal (tampered/mismatched tx) and keeps the form usable", async () => {
    const client = fakeClient({ submitIntent: vi.fn().mockRejectedValue(new ApiError(422, "TX_MISMATCH", "argument amount differs from the approved intent", "req_9")) });
    render(<IntentPanel intent={base} client={client} now={now} pollMs={1e9} />);
    await userEvent.type(screen.getByLabelText(/signed transaction/i), LONG);
    await userEvent.click(screen.getByRole("button", { name: /submit signed/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("differs from the approved intent");
    expect(screen.getByRole("alert")).toHaveTextContent("req_9");
    expect(screen.getByLabelText(/signed transaction/i)).toBeEnabled();
  });

  it("an expired request cannot be signed", () => {
    render(<IntentPanel intent={{ ...base, expiresAt: "2026-03-01T00:00:00.000Z" }} client={fakeClient()} now={now} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/expired/i);
    expect(screen.queryByRole("button", { name: /submit signed/i })).not.toBeInTheDocument();
  });

  it("polls a submitted intent until the indexer confirms it, tolerating a failed poll", async () => {
    vi.useFakeTimers();
    try {
      const getIntent = vi.fn().mockRejectedValueOnce(new ApiError(503, "INDEXER_STALE", "stale")).mockResolvedValue({ ...base, state: "CONFIRMED", txHash: "cd".repeat(32) });
      render(<IntentPanel intent={{ ...base, state: "SUBMITTED", txHash: "cd".repeat(32) }} client={fakeClient({ getIntent })} now={now} pollMs={1000} />);
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      expect(screen.getByText("Submitted, not yet confirmed")).toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      expect(screen.getByText("Confirmed on-chain")).toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });

  it("FAILED says nothing changed on-chain and shows the reason", () => {
    render(<IntentPanel intent={{ ...base, state: "FAILED", failureReason: "EXPIRED_BEFORE_SIGNATURE" }} client={fakeClient()} now={now} />);
    expect(screen.getByText(/no change was made on-chain/i)).toBeInTheDocument();
    expect(screen.getByText("EXPIRED_BEFORE_SIGNATURE")).toBeInTheDocument();
  });
});

describe("CoveragePanel", () => {
  it("renders exact amounts, freshness, and a reconciling warning", () => {
    const { rerender } = render(<CoveragePanel coverage={{ circleId: "c", bound: true, poolId: "1", totals: { funded: "10000000000", reserved: "6000000000", claimed: "0", withdrawn: "0" }, unreserved: "4000000000", fullyBacked: true, poolStatus: "Active", indexerStatus: "SYNCED", asOfLedger: 77, lagLedgers: 0, observedAt: "x" }} />);
    expect(screen.getByText(/Fully backed/)).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.getByText(/As of ledger 77/)).toBeInTheDocument();
    rerender(<CoveragePanel coverage={{ circleId: "c", bound: true, poolId: "1", totals: { funded: "1", reserved: "0", claimed: "0", withdrawn: "0" }, unreserved: "1", fullyBacked: true, poolStatus: "Active", indexerStatus: "RECONCILING", asOfLedger: 77, lagLedgers: 0, observedAt: "x" }} />);
    expect(screen.getByText(/under reconciliation/)).toBeInTheDocument();
    expect(screen.queryByText(/Fully backed/)).not.toBeInTheDocument();
  });
  it("unbound shows an explanation and no numbers", () => {
    render(<CoveragePanel coverage={{ circleId: "c", bound: false }} />);
    expect(screen.getByText("No on-chain pool yet")).toBeInTheDocument();
    expect(screen.queryByRole("term")).not.toBeInTheDocument();
  });
});

describe("RightsTable", () => {
  const r = (id: string, owner: string, over: Partial<Right> = {}): Right => ({ rightId: id, poolId: "1", amount: "1000000000", owner, maturity: 2000, state: "Issued", pendingTransfer: null, issuedAtLedger: 1, claimedAtLedger: null, ...over });
  it("enables only actions the viewer can take, and wires callbacks", async () => {
    const onTransfer = vi.fn(); const onClaim = vi.fn();
    render(<RightsTable rights={[r("1", "GME"), r("2", "GOTHER"), r("3", "GME", { maturity: 9_999_999_999 })]} myAddress="GME" now={new Date(3000 * 1000)} onTransfer={onTransfer} onClaim={onClaim} />);
    const rows = screen.getAllByRole("row").slice(1);
    const [claim1, claim2, claim3] = rows.map((row) => row.querySelector("button:last-child") as HTMLButtonElement);
    expect(claim1).toBeEnabled(); expect(claim2).toBeDisabled(); expect(claim3).toBeDisabled();
    await userEvent.click(claim1!);
    expect(onClaim).toHaveBeenCalledWith(expect.objectContaining({ rightId: "1" }));
    await userEvent.click(rows[2]!.querySelector("button")!);
    expect(onTransfer).toHaveBeenCalledWith(expect.objectContaining({ rightId: "3" }));
  });
  it("empty state is explicit", () => {
    render(<RightsTable rights={[]} myAddress={null} onTransfer={vi.fn()} onClaim={vi.fn()} />);
    expect(screen.getByText(/No payout rights have been issued/)).toBeInTheDocument();
  });
});

describe("SessionGate", () => {
  const client = {} as ApiClient;
  it("blocks until a valid PUBLIC address and token are given, never accepts a secret key", async () => {
    window.sessionStorage.clear();
    render(<SessionProvider client={client}><SessionGate><p>inside</p></SessionGate></SessionProvider>);
    expect(screen.queryByText("inside")).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/api token/i), "tok-0123456789abcdef");
    await userEvent.type(screen.getByLabelText(/public stellar address/i), "S" + "A".repeat(55)); // looks like a secret seed
    expect(screen.getByRole("alert")).toHaveTextContent(/not a valid public address/);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    await userEvent.clear(screen.getByLabelText(/public stellar address/i));
    await userEvent.type(screen.getByLabelText(/public stellar address/i), "G" + "A".repeat(55));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("inside")).toBeInTheDocument());
    expect(window.sessionStorage.getItem("torrent.session.v1")).not.toContain("S" + "A".repeat(55));
    expect(window.localStorage.length).toBe(0);
  });
});
