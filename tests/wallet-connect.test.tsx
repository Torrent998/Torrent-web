import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Keypair, Networks } from "@stellar/stellar-sdk";
import { describe, expect, it, vi } from "vitest";
import { AskProvider } from "@/components/ask-dialog";
import { WalletConnect } from "@/components/wallet-connect";
import type { ApiClient } from "@/lib/api/client";
import { SessionProvider } from "@/lib/session";
import type { FreighterApi } from "@/lib/wallet/freighter";

const kp = Keypair.random();
const extension = (over: Partial<FreighterApi> = {}): FreighterApi => ({
  isConnected: async () => ({ isConnected: true }),
  requestAccess: async () => ({ address: kp.publicKey() }),
  getNetworkDetails: async () => ({ network: "TESTNET", networkPassphrase: Networks.TESTNET }),
  signMessage: async (m) => ({ signedMessage: Buffer.from(kp.signMessage(m)).toString("base64"), signerAddress: kp.publicKey() }),
  signTransaction: async () => ({ signedTxXdr: "", signerAddress: kp.publicKey() }),
  ...over,
});
const mount = (client: ApiClient, load: () => Promise<FreighterApi>) => {
  window.sessionStorage.clear();
  return render(<SessionProvider client={client}><AskProvider><WalletConnect mode="signin" loadFreighter={load} /></AskProvider></SessionProvider>);
};

describe("WalletConnect with the Freighter browser extension", () => {
  it("offers Freighter only when the extension answers, and signs in with its SEP-53 signature", async () => {
    const client = {
      authChallenge: vi.fn().mockResolvedValue({ challengeId: "chal_9", message: "Torrent login nonce=9", expiresAt: "x" }),
      authLogin: vi.fn().mockResolvedValue({ token: "tok-freighter-0123456789", expiresAt: "x", userId: "u", address: kp.publicKey(), roles: ["user"] }),
    } as unknown as ApiClient;
    mount(client, async () => extension());
    await userEvent.click(await screen.findByRole("button", { name: /sign in with freighter/i }));
    await waitFor(() => expect(client.authLogin).toHaveBeenCalled());
    expect(client.authChallenge).toHaveBeenCalledWith(kp.publicKey());
    const [, sig] = (client.authLogin as ReturnType<typeof vi.fn>).mock.calls[0] as [string, string];
    // ed25519 is deterministic: the app forwards exactly the extension's SEP-53 signature
    expect(sig).toBe(Buffer.from(kp.signMessage("Torrent login nonce=9")).toString("base64"));
    expect(JSON.parse(window.sessionStorage.getItem("torrent.session.v2")!)).toEqual({ token: "tok-freighter-0123456789", address: kp.publicKey() });
  });

  it("explains when Freighter is missing and keeps the paste flow available", async () => {
    mount({} as ApiClient, async () => extension({ isConnected: async () => ({ isConnected: false }) }));
    expect(await screen.findByTestId("freighter-missing")).toHaveTextContent(/not detected/i);
    expect(screen.queryByRole("button", { name: /freighter/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in by signing elsewhere/i })).toBeInTheDocument();
  });

  it("treats a failing loader as missing and shows wallet errors (wrong network) without signing in", async () => {
    mount({} as ApiClient, async () => { throw new Error("chunk failed"); });
    expect(await screen.findByTestId("freighter-missing")).toBeInTheDocument();
    const client = { authChallenge: vi.fn() } as unknown as ApiClient;
    mount(client, async () => extension({ getNetworkDetails: async () => ({ network: "PUBLIC", networkPassphrase: Networks.PUBLIC }) }));
    await userEvent.click(await screen.findByRole("button", { name: /sign in with freighter/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/switch it to testnet/i);
    expect(client.authChallenge).not.toHaveBeenCalled();
  });
});
