import { Account, Contract, Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import type { Intent } from "@/lib/api/schemas";
import { toScVal } from "./scval";
import type { WalletAdapter } from "./types";

/**
 * TEST ADAPTER - NOT A WALLET. Holds a throwaway random Testnet keypair in memory (never persisted)
 * and signs for it. The transactions are well-formed and correctly signed, so the API's
 * verification accepts them, but they use a placeholder sequence number and no fee preparation:
 * they are NOT submittable on a real network. Only enabled with NEXT_PUBLIC_ENABLE_TEST_WALLET=1.
 */
export class TestWalletAdapter implements WalletAdapter {
  readonly id = "test";
  readonly label = "TEST WALLET (throwaway key, not a real wallet)";
  readonly isTestAdapter = true;
  private readonly kp: Keypair;
  constructor(kp?: Keypair) { this.kp = kp ?? Keypair.random(); }

  async connect() { return { address: this.kp.publicKey() }; }
  async signMessage(message: string) { return Buffer.from(this.kp.signMessage(message)).toString("base64"); }
  async signIntent(intent: Intent, networkPassphrase: string) {
    const d = intent.descriptor;
    const tx = new TransactionBuilder(new Account(this.kp.publicKey(), "1"), { fee: "100", networkPassphrase })
      .addOperation(new Contract(d.contractId).call(d.function, ...d.args.map(toScVal)))
      .setTimeout(300).build();
    tx.sign(this.kp);
    return tx.toXDR();
  }
}

export const testWalletEnabled = (): boolean => process.env["NEXT_PUBLIC_ENABLE_TEST_WALLET"] === "1";
