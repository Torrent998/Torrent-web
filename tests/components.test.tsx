import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoveragePanel } from "@/components/coverage-panel";
import { IntentPanel } from "@/components/intent-panel";
import { RightsTable } from "@/components/rights-table";
import { AskProvider } from "@/components/ask-dialog";
import { SessionGate } from "@/components/session-gate";
import { WalletError, type WalletAdapter } from "@/lib/wallet/types";
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

const PASS = "Test SDF Network ; September 2015";
const fakeWallet = (over: Partial<WalletAdapter> = {}): WalletAdapter => ({
  id: "fake", label: "Fake Wallet", isTestAdapter: false,
  connect: vi.fn(), signMessage: vi.fn(), signIntent: vi.fn().mockResolvedValue(LONG), ...over,
});
const panel = (over: Partial<Parameters<typeof IntentPanel>[0]> = {}) => (
  <IntentPanel intent={base} client={fakeClient()} wallet={fakeWallet()} networkPassphrase={PASS} now={now} pollMs={1e9} {...over} />
);

describe("IntentPanel", () => {
  it("shows what will be signed and that nothing happened on-chain yet", () => {
    render(panel());
    expect(screen.getByText("Needs your signature")).toBeInTheDocument();
    expect(screen.getByText(/nothing has happened on-chain/i)).toBeInTheDocument();
    expect(screen.getByText(/deposit\(amount = 1\.5 \(15000000 base units\)\)/)).toBeInTheDocument();
    expect(screen.getByText(/15m 0s/)).toBeInTheDocument();
  });

  it("asks the wallet to sign the intent, submits the result, and shows SUBMITTED as not yet confirmed", async () => {
    const submitted: Intent = { ...base, state: "SUBMITTED", txHash: "ab".repeat(32) };
    const client = fakeClient({ submitIntent: vi.fn().mockResolvedValue({ intent: submitted }) });
    const wallet = fakeWallet();
    render(panel({ client, wallet }));
    await userEvent.click(screen.getByRole("button", { name: /sign and submit with fake wallet/i }));
    expect(wallet.signIntent).toHaveBeenCalledWith(expect.objectContaining({ id: "int_1" }), PASS);
    expect(client.submitIntent).toHaveBeenCalledWith("int_1", LONG);
    expect(await screen.findByText("Submitted, not yet confirmed")).toBeInTheDocument();
    expect(screen.queryByText(/confirmed on-chain/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Transaction: abab/)).toBeInTheDocument();
  });

  it("a cancelled or failed wallet signature shows an error and nothing is submitted", async () => {
    const client = fakeClient();
    const wallet = fakeWallet({ signIntent: vi.fn().mockRejectedValue(new WalletError("CANCELLED", "Signing cancelled.")) });
    render(panel({ client, wallet }));
    await userEvent.click(screen.getByRole("button", { name: /sign and submit/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Signing cancelled.");
    expect(client.submitIntent).not.toHaveBeenCalled();
  });

  it("surfaces a server refusal (tampered/mismatched tx) and keeps the button usable", async () => {
    const client = fakeClient({ submitIntent: vi.fn().mockRejectedValue(new ApiError(422, "TX_MISMATCH", "argument amount differs from the approved intent", "req_9")) });
    render(panel({ client }));
    await userEvent.click(screen.getByRole("button", { name: /sign and submit/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("differs from the approved intent");
    expect(screen.getByRole("alert")).toHaveTextContent("req_9");
    expect(screen.getByRole("button", { name: /sign and submit/i })).toBeEnabled();
  });

  it("labels test wallets loudly", () => {
    render(panel({ wallet: fakeWallet({ isTestAdapter: true, label: "TEST WALLET (x)" }) }));
    expect(screen.getByText("TEST WALLET")).toBeInTheDocument();
    expect(screen.getByText(/not submittable on a real network/i)).toBeInTheDocument();
  });

  it("without a wallet it asks to reconnect instead of offering to sign", () => {
    render(panel({ wallet: null, reconnect: <p>RECONNECT-SLOT</p> }));
    expect(screen.getByText("RECONNECT-SLOT")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign and submit/i })).not.toBeInTheDocument();
  });

  it("an expired request cannot be signed", () => {
    render(panel({ intent: { ...base, expiresAt: "2026-03-01T00:00:00.000Z" } }));
    expect(screen.getByRole("alert")).toHaveTextContent(/expired/i);
    expect(screen.queryByRole("button", { name: /sign and submit/i })).not.toBeInTheDocument();
  });

  it("polls a submitted intent until the indexer confirms it, tolerating a failed poll", async () => {
    vi.useFakeTimers();
    try {
      const getIntent = vi.fn().mockRejectedValueOnce(new ApiError(503, "INDEXER_STALE", "stale")).mockResolvedValue({ ...base, state: "CONFIRMED", txHash: "cd".repeat(32) });
      render(panel({ intent: { ...base, state: "SUBMITTED", txHash: "cd".repeat(32) }, client: fakeClient({ getIntent }), pollMs: 1000 }));
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      expect(screen.getByText("Submitted, not yet confirmed")).toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      expect(screen.getByText("Confirmed on-chain")).toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });

  it("FAILED says nothing changed on-chain and shows the reason", () => {
    render(panel({ intent: { ...base, state: "FAILED", failureReason: "EXPIRED_BEFORE_SIGNATURE" } }));
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

describe("SessionGate (wallet sign-in)", () => {
  function renderGate(client: ApiClient) {
    window.sessionStorage.clear();
    return render(<SessionProvider client={client}><AskProvider><SessionGate><p>inside</p></SessionGate></AskProvider></SessionProvider>);
  }
  it("does not accept a secret key as an address", async () => {
    renderGate({} as ApiClient);
    await userEvent.click(screen.getByRole("button", { name: /use a different wallet/i }));
    await userEvent.type(screen.getByLabelText(/public stellar address/i), "S" + "A".repeat(55));
    expect(screen.getByRole("alert")).toHaveTextContent(/not a valid public address/);
    expect(screen.getByRole("button", { name: /sign in by signing elsewhere/i })).toBeDisabled();
    expect(screen.queryByText("inside")).not.toBeInTheDocument();
  });
  it("walks challenge -> pasted wallet signature -> session, and stores only token + public address", async () => {
    const addr = "G" + "A".repeat(55);
    const client = {
      authChallenge: vi.fn().mockResolvedValue({ challengeId: "chal_1", message: "sign me", expiresAt: "x" }),
      authLogin: vi.fn().mockResolvedValue({ token: "tok-session-0123456789", expiresAt: "x", userId: "u", address: addr, roles: ["user"] }),
    } as unknown as ApiClient;
    renderGate(client);
    await userEvent.click(screen.getByRole("button", { name: /use a different wallet/i }));
    await userEvent.type(screen.getByLabelText(/public stellar address/i), addr);
    await userEvent.click(screen.getByRole("button", { name: /sign in by signing elsewhere/i }));
    const dlg = await screen.findByRole("dialog");
    expect(dlg).toHaveTextContent("sign me");
    expect(dlg).toHaveTextContent(/authorizes no payment/i);
    await userEvent.type(screen.getByLabelText(/signature \(base64\)/i), "c2lnbmF0dXJl");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("inside")).toBeInTheDocument());
    expect(client.authChallenge).toHaveBeenCalledWith(addr);
    expect(client.authLogin).toHaveBeenCalledWith("chal_1", "c2lnbmF0dXJl");
    expect(JSON.parse(window.sessionStorage.getItem("torrent.session.v2")!)).toEqual({ token: "tok-session-0123456789", address: addr });
    expect(window.localStorage.length).toBe(0);
  });
  it("cancelling the signature dialog leaves you signed out with a clear message", async () => {
    const client = { authChallenge: vi.fn().mockResolvedValue({ challengeId: "c", message: "m", expiresAt: "x" }), authLogin: vi.fn() } as unknown as ApiClient;
    renderGate(client);
    await userEvent.click(screen.getByRole("button", { name: /use a different wallet/i }));
    await userEvent.type(screen.getByLabelText(/public stellar address/i), "G" + "A".repeat(55));
    await userEvent.click(screen.getByRole("button", { name: /sign in by signing elsewhere/i }));
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/cancelled/i);
    expect(client.authLogin).not.toHaveBeenCalled();
    expect(screen.queryByText("inside")).not.toBeInTheDocument();
  });
  it("shows the API's refusal when the signature is rejected", async () => {
    const client = { authChallenge: vi.fn().mockResolvedValue({ challengeId: "c", message: "m", expiresAt: "x" }), authLogin: vi.fn().mockRejectedValue(new ApiError(401, "UNAUTHENTICATED", "invalid or expired challenge, or signature does not verify")) } as unknown as ApiClient;
    renderGate(client);
    await userEvent.click(screen.getByRole("button", { name: /use a different wallet/i }));
    await userEvent.type(screen.getByLabelText(/public stellar address/i), "G" + "A".repeat(55));
    await userEvent.click(screen.getByRole("button", { name: /sign in by signing elsewhere/i }));
    await userEvent.type(await screen.findByLabelText(/signature/i), "AAAA");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/does not verify/);
  });
});

describe("SessionProvider configuration validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders a loud configuration error naming NEXT_PUBLIC_API_BASE_URL in production when neither baseUrl, client, nor NEXT_PUBLIC_API_BASE_URL is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    render(<SessionProvider><p>app-shell</p></SessionProvider>);
    expect(screen.getByRole("alert")).toHaveTextContent(/Configuration error/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/NEXT_PUBLIC_API_BASE_URL/);
    expect(screen.queryByText("app-shell")).not.toBeInTheDocument();
  });

  it("renders children normally in development without NEXT_PUBLIC_API_BASE_URL or in production when baseUrl/client is provided", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    const { unmount } = render(<SessionProvider><p>dev-shell</p></SessionProvider>);
    expect(screen.getByText("dev-shell")).toBeInTheDocument();
    unmount();

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    const { unmount: unmountBaseUrl } = render(<SessionProvider baseUrl="https://api.torrent.example"><p>prod-shell</p></SessionProvider>);
    expect(screen.getByText("prod-shell")).toBeInTheDocument();
    unmountBaseUrl();

    render(<SessionProvider client={fakeClient()}><p>client-shell</p></SessionProvider>);
    expect(screen.getByText("client-shell")).toBeInTheDocument();
  });
});
