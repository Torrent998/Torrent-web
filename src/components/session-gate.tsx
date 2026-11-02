"use client";
import type { ReactNode } from "react";
import { useSession } from "@/lib/session";
import { IconCheck, IconKey } from "./icons";
import { Card, Loading } from "./ui";
import { WalletConnect } from "./wallet-connect";

/** Wallet-signature sign-in. The session proves control of an address; it authorizes no payment. */
export function SessionGate({ children }: { children: ReactNode }) {
  const s = useSession();
  if (!s.ready) return <Loading what="session" />;
  if (s.token && s.address) return <>{children}</>;
  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
      <div className="pt-2">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><IconKey /></span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Sign in to Torrent</h1>
        <p className="mt-3 text-muted">Prove you control a Stellar address by signing a one-time message with your own wallet.</p>
        <ul className="mt-6 grid gap-3 text-sm">
          {["Signing the message moves no funds.", "This app never asks for a secret key or seed phrase.", "Your session lives in this tab only."].map((t) => (
            <li key={t} className="flex gap-2.5"><IconCheck width={18} height={18} className="mt-0.5 shrink-0 text-brand-text" />{t}</li>
          ))}
        </ul>
      </div>
      <Card title="Sign in with your wallet">
        <p className="mb-4 text-sm text-muted">
          Stellar Testnet only. Enter your public address, sign the challenge in your own wallet, then paste the signature back here.
        </p>
        <WalletConnect mode="signin" />
      </Card>
    </div>
  );
}
