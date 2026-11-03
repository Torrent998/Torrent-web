import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import type { Intent } from "@/lib/api/schemas";
import { AskProvider } from "@/components/ask-dialog";
import { SessionProvider } from "@/lib/session";

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "cir_1" }) }));
import CirclePage from "@/app/circles/[id]/page";

const ME = "G" + "A".repeat(55);
const circle = { id: "cir_1", name: "Ajo", ruleSet: { tokenContractId: "C", maxMembers: 3, rounds: 3, roundLengthDays: 30, contributionAmount: "100", transferPolicy: "MEMBERS_ONLY" as const }, policyHash: "ab".repeat(32), poolId: "1", organizerAddress: ME, members: [], createdAt: "x", updatedAt: "x" };
const coverage = { circleId: "cir_1", bound: true as const, poolId: "1", totals: { funded: "1000000000", reserved: "0", claimed: "0", withdrawn: "0" }, unreserved: "1000000000", fullyBacked: true, poolStatus: "Active" as const, indexerStatus: "SYNCED" as const, asOfLedger: 9, lagLedgers: 0, observedAt: "x" };
const intent: Intent = { id: "int_9", schemaVersion: 1, requestId: "r", kind: "FUNDING", circleId: "cir_1", state: "AWAITING_SIGNATURE", descriptor: { contractId: "C1", function: "deposit", args: [{ name: "amount", type: "i128", value: "25000000" }] }, txHash: null, failureReason: null, verifiedAtLedger: 9, expiresAt: new Date(Date.now() + 600_000).toISOString(), createdAt: "x", updatedAt: "x" };

const gov = { contractId: "C1", abiVersion: 2 as const, admin: null, pendingAdmin: null, pendingUpgrade: null, upgradesLocked: false, upgrades: [], indexerStatus: "SYNCED" as const, latestObservedLedger: 9 };
function client(over: Record<string, unknown> = {}) {
  return {
    getCircle: vi.fn().mockResolvedValue(circle), coverage: vi.fn().mockResolvedValue(coverage),
    rights: vi.fn().mockResolvedValue({ circleId: "cir_1", bound: true, asOfLedger: 9, rights: [{ rightId: "5", poolId: "1", amount: "1000000000", owner: ME, maturity: 1, state: "Issued", pendingTransfer: null, issuedAtLedger: 1, claimedAtLedger: null }] }),
    listTransfers: vi.fn().mockResolvedValue({ transfers: [] }), listIntents: vi.fn().mockResolvedValue({ intents: [] }),
    contract: vi.fn().mockResolvedValue(gov), leaveIntent: vi.fn().mockResolvedValue({ intent: { ...intent, kind: "POOL_LEAVE" } }),
    fundingIntent: vi.fn().mockResolvedValue(intent), claimIntent: vi.fn().mockResolvedValue({ intent: { ...intent, kind: "CLAIM" } }),
    ...over,
  } as unknown as ApiClient;
}
function renderPage(c: ApiClient) {
  window.sessionStorage.setItem("torrent.session.v2", JSON.stringify({ token: "tok-0123456789abcdef", address: ME }));
  return render(<SessionProvider client={c}><AskProvider><CirclePage /></AskProvider></SessionProvider>);
}
beforeEach(() => window.sessionStorage.clear());

describe("circle page", () => {
  it("shows ledger-derived coverage and rights", async () => {
    renderPage(client());
    expect(await screen.findByText(/Fully backed/)).toBeInTheDocument();
    expect(await screen.findByText("#5")).toBeInTheDocument();
    expect(screen.getByText(/Ledger data as of ledger 9/)).toBeInTheDocument();
  });
  it("funding converts the typed amount to exact base units and opens the signing request", async () => {
    const c = client(); renderPage(c);
    await screen.findByText(/Fully backed/);
    const btn = screen.getByRole("button", { name: "Request signature" });
    expect(btn).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/amount to deposit/i), "2.5");
    await userEvent.click(btn);
    expect(c.fundingIntent).toHaveBeenCalledWith("cir_1", "25000000");
    expect(await screen.findByText("Needs your signature")).toBeInTheDocument();
  });
  it("rejects bad amounts client-side (no request sent)", async () => {
    const c = client(); renderPage(c);
    await screen.findByText(/Fully backed/);
    await userEvent.type(screen.getByLabelText(/amount to deposit/i), "1e3");
    expect(screen.getByRole("button", { name: "Request signature" })).toBeDisabled();
    expect(c.fundingIntent).not.toHaveBeenCalled();
  });
  it("claim goes through the server; a refusal is shown, not hidden", async () => {
    const c = client({ claimIntent: vi.fn().mockRejectedValue(new ApiError(422, "NOT_MATURED", "right matures at 2030-01-01")) });
    renderPage(c);
    await userEvent.click(await screen.findByRole("button", { name: "Claim" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("right matures at 2030-01-01");
  });
  it("indexer outage on coverage shows a retryable error instead of stale numbers", async () => {
    const coverageFn = vi.fn().mockRejectedValueOnce(new ApiError(503, "INDEXER_UNREACHABLE", "indexer is not reachable")).mockResolvedValue(coverage);
    renderPage(client({ coverage: coverageFn }));
    expect(await screen.findByText("indexer is not reachable")).toBeInTheDocument();
    expect(screen.queryByText(/Fully backed/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByText(/Fully backed/)).toBeInTheDocument());
  });

  it("announces a pending contract upgrade with its timelock", async () => {
    renderPage(client({ contract: vi.fn().mockResolvedValue({ ...gov, pendingUpgrade: { wasmHash: "ef".repeat(32), executableAfter: 4_102_444_800, proposedAtLedger: 8 } }) }));
    const banner = await screen.findByTestId("governance");
    expect(banner).toHaveTextContent(/upgrade has been announced/i);
    expect(banner).toHaveTextContent(/cannot take effect before 2100-01-01 00:00 UTC/);
  });
  it("a closed pool accepts no funding", async () => {
    renderPage(client({ coverage: vi.fn().mockResolvedValue({ ...coverage, poolStatus: "Closed" }) }));
    expect(await screen.findByText(/accepts no new funding/)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount to deposit/i)).toBeDisabled();
  });
  it("members can request to leave only when they own no unclaimed right", async () => {
    const other = { ...circle, organizerAddress: "G" + "Z".repeat(55) };
    const c = client({ getCircle: vi.fn().mockResolvedValue(other), rights: vi.fn().mockResolvedValue({ circleId: "cir_1", bound: true, rights: [] }) });
    renderPage(c);
    await userEvent.click(await screen.findByRole("button", { name: /request leave signature/i }));
    expect(c.leaveIntent).toHaveBeenCalledWith("cir_1");
    expect(await screen.findByText("Needs your signature")).toBeInTheDocument();
    renderPage(client({ getCircle: vi.fn().mockResolvedValue(other) })); // owns right #5
    expect(await screen.findByText(/still own an unclaimed right/)).toBeInTheDocument();
  });
});
