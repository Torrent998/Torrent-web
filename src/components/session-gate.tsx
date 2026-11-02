"use client";
import type { ReactNode } from "react";
import { useSession } from "@/lib/session";
import { Card } from "./ui";
import { WalletConnect } from "./wallet-connect";

/** Wallet-signature sign-in. The session proves control of an address; it authorizes no payment. */
export function SessionGate({ children }: { children: ReactNode }) {
  const s = useSession();
  if (s.token && s.address) return <>{children}</>;
  return (
    <Card title="Sign in with your wallet">
      <p className="mb-3 text-muted">
        Testnet only. You prove you control a Stellar address by signing a one-time message. Signing it moves no funds. This app never asks for a secret key or seed phrase.
      </p>
      <WalletConnect mode="signin" />
    </Card>
  );
}
