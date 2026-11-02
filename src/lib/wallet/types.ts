import type { Intent } from "@/lib/api/schemas";

/**
 * Everything the app needs from a wallet. The app never sees a secret key: it hands the wallet a
 * message to sign (login) or the exact contract call to sign (intents), and gets signatures back.
 */
export interface WalletAdapter {
  readonly id: string;
  readonly label: string;
  /** True for adapters that must never be mistaken for a real wallet. The UI labels them. */
  readonly isTestAdapter: boolean;
  /** Returns the PUBLIC account address (G...) the wallet will sign with. */
  connect(): Promise<{ address: string }>;
  /** SEP-53 style message signature, base64 (64-byte ed25519). */
  signMessage(message: string): Promise<string>;
  /** Returns a signed transaction (base64 XDR) that invokes exactly `intent.descriptor`. */
  signIntent(intent: Intent, networkPassphrase: string): Promise<string>;
}

export class WalletError extends Error {
  constructor(public readonly code: "CANCELLED" | "UNAVAILABLE" | "INVALID", message: string) {
    super(message);
    this.name = "WalletError";
  }
}

/** Asks the user for pasted text (used by the manual adapter). Resolves null if cancelled. */
export type AskUser = (req: { title: string; instructions: string; context?: string; label: string }) => Promise<string | null>;
