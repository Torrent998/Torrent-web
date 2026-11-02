import type { Intent } from "@/lib/api/schemas";
import { describeDescriptor } from "@/features/view";
import { WalletError, type AskUser, type WalletAdapter } from "./types";

/**
 * Real, honest fallback: the user signs OUTSIDE this app (their wallet or stellar CLI) and pastes
 * the result. Works with any signer; nothing is simulated.
 */
export class ManualWalletAdapter implements WalletAdapter {
  readonly id = "manual";
  readonly label = "Sign elsewhere and paste";
  readonly isTestAdapter = false;
  constructor(private readonly ask: AskUser, private readonly address: string) {}

  async connect() {
    if (!/^G[A-Z2-7]{55}$/.test(this.address)) throw new WalletError("INVALID", "Enter your public Stellar address (starts with G).");
    return { address: this.address };
  }
  async signMessage(message: string) {
    const sig = await this.ask({
      title: "Sign the login message", label: "Signature (base64)", context: message,
      instructions: "Sign this exact message with your wallet's \"sign message\" (SEP-53) and paste the base64 signature. It authorizes no payment.",
    });
    if (!sig) throw new WalletError("CANCELLED", "Sign-in cancelled.");
    return sig.trim();
  }
  async signIntent(intent: Intent) {
    const xdr = await this.ask({
      title: "Sign the transaction", label: "Signed transaction (base64 XDR)", context: describeDescriptor(intent),
      instructions: "Build a transaction that invokes exactly this contract call, sign it with your account, and paste the signed XDR.",
    });
    if (!xdr) throw new WalletError("CANCELLED", "Signing cancelled.");
    return xdr.trim();
  }
}
