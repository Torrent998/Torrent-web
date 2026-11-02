import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuditPanel } from "@/components/audit-panel";
import { HistoryPanel } from "@/components/history-panel";
import { InvitePanel } from "@/components/invite-panel";
import { TransfersPanel } from "@/components/transfers-panel";
import { ApiError, type ApiClient } from "@/lib/api/client";
import type { Intent, Right, TransferRecord } from "@/lib/api/schemas";

const ME = "G" + "B".repeat(55); const OTHER = "G" + "C".repeat(55);
const tr = (over: Partial<TransferRecord> = {}): TransferRecord => ({
  id: "trf_1", circleId: "c", rightId: "5", from: OTHER, to: ME, expiresAt: "2026-03-02T00:00:00Z", proposeIntentId: "i1", acceptIntentId: null,
  chainTransferId: "77", createdAt: "x", status: "AWAITING_RECIPIENT", ...over,
});
const intent: Intent = { id: "int_2", schemaVersion: 1, requestId: "r", kind: "TRANSFER_ACCEPT", circleId: "c", state: "AWAITING_SIGNATURE", descriptor: { contractId: "C", function: "accept_transfer", args: [] }, txHash: null, failureReason: null, verifiedAtLedger: 1, expiresAt: "x", createdAt: "2026-03-01", updatedAt: "x" };

describe("TransfersPanel (recipient approval)", () => {
  it("offers approval only to the named recipient of an on-chain proposal, and hands the accept intent to signing", async () => {
    const approveTransfer = vi.fn().mockResolvedValue({ transfer: tr(), intent });
    const onIntent = vi.fn();
    render(<TransfersPanel transfers={[tr(), tr({ id: "trf_2", to: OTHER, from: ME }), tr({ id: "trf_3", status: "PROPOSING" }), tr({ id: "trf_4", status: "COMPLETED" })]} myAddress={ME} client={{ approveTransfer } as unknown as ApiClient} onIntent={onIntent} />);
    const buttons = screen.getAllByRole("button", { name: /review and approve/i });
    expect(buttons).toHaveLength(1);
    await userEvent.click(buttons[0]!);
    expect(approveTransfer).toHaveBeenCalledWith("trf_1");
    expect(onIntent).toHaveBeenCalledWith(intent);
    expect(screen.getByText(/Completed: ownership changed on-chain/)).toBeInTheDocument();
    expect(screen.getByText(/Proposal waiting/)).toBeInTheDocument();
  });
  it("shows a stale-proposal refusal from the server", async () => {
    const approveTransfer = vi.fn().mockRejectedValue(new ApiError(409, "STALE_TRANSFER", "on-chain proposal expired"));
    render(<TransfersPanel transfers={[tr()]} myAddress={ME} client={{ approveTransfer } as unknown as ApiClient} onIntent={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /review and approve/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("on-chain proposal expired");
  });
  it("empty state", () => {
    render(<TransfersPanel transfers={[]} myAddress={ME} client={{} as ApiClient} onIntent={vi.fn()} />);
    expect(screen.getByText(/No transfer proposals/)).toBeInTheDocument();
  });
});

describe("InvitePanel", () => {
  it("shows the invitation code once with a warning", async () => {
    const createInvitation = vi.fn().mockResolvedValue({ invitation: { id: "inv", label: "bob", status: "PENDING", expiresAt: "2026-03-08" }, token: "secret-code-123456789" });
    render(<InvitePanel client={{ createInvitation } as unknown as ApiClient} circleId="c" />);
    expect(screen.getByRole("button", { name: "Create invitation" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/who is this for/i), "bob");
    await userEvent.click(screen.getByRole("button", { name: "Create invitation" }));
    expect(createInvitation).toHaveBeenCalledWith("c", "bob");
    expect(await screen.findByText("secret-code-123456789")).toBeInTheDocument();
    expect(screen.getByText(/shown once/i)).toBeInTheDocument();
  });
  it("shows a refusal (e.g. circle full)", async () => {
    const createInvitation = vi.fn().mockRejectedValue(new ApiError(422, "CIRCLE_FULL", "circle already has the maximum number of members"));
    render(<InvitePanel client={{ createInvitation } as unknown as ApiClient} circleId="c" />);
    await userEvent.type(screen.getByLabelText(/who is this for/i), "x");
    await userEvent.click(screen.getByRole("button", { name: "Create invitation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("maximum number of members");
  });
});

describe("HistoryPanel", () => {
  const r = (id: string, state: Right["state"], owner = ME): Right => ({ rightId: id, poolId: "1", amount: "5000000", owner, maturity: 1, state, pendingTransfer: null, issuedAtLedger: 1, claimedAtLedger: state === "Claimed" ? 42 : null });
  it("lists ledger-confirmed payouts separately from the user's own requests, with honest states", () => {
    render(<HistoryPanel rights={[r("1", "Claimed"), r("2", "Issued"), r("3", "Claimed", OTHER)]} intents={[{ ...intent, kind: "CLAIM", state: "SUBMITTED" }]} myAddress={ME} />);
    expect(screen.getAllByText(/claimed at ledger/)).toHaveLength(2);
    expect(screen.getByText("Claim payout")).toBeInTheDocument();
    expect(screen.getByText("Submitted, not yet confirmed")).toBeInTheDocument();
  });
  it("empty states", () => {
    render(<HistoryPanel rights={[]} intents={[]} myAddress={ME} />);
    expect(screen.getByText(/No payout has been claimed yet/)).toBeInTheDocument();
    expect(screen.getByText(/not made any requests/)).toBeInTheDocument();
  });
});

describe("AuditPanel", () => {
  const e = (i: number) => ({ id: `aud_${i}`, at: "t", actor: "usr_1", scope: "circle:c", action: `act.${i}`, object: "o", requestId: "req" });
  it("loads on demand and pages with the cursor", async () => {
    const audit = vi.fn()
      .mockResolvedValueOnce({ nextCursor: "aud_19", events: Array.from({ length: 20 }, (_, i) => e(i)) })
      .mockResolvedValueOnce({ nextCursor: "aud_20", events: [e(20)] });
    render(<AuditPanel client={{ audit } as unknown as ApiClient} circleId="c" />);
    await userEvent.click(screen.getByRole("button", { name: "Load audit trail" }));
    expect(await screen.findByText("act.0")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(audit).toHaveBeenLastCalledWith("c", "aud_19", 20);
    expect(await screen.findByText("act.20")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });
  it("shows a 403 for non-organizers", async () => {
    const audit = vi.fn().mockRejectedValue(new ApiError(403, "FORBIDDEN", "organizer or auditor role required"));
    render(<AuditPanel client={{ audit } as unknown as ApiClient} circleId="c" />);
    await userEvent.click(screen.getByRole("button", { name: "Load audit trail" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("organizer or auditor");
  });
});
