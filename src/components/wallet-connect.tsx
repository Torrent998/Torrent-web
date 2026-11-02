"use client";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/session";
import { ManualWalletAdapter } from "@/lib/wallet/manual";
import { testWalletEnabled } from "@/lib/wallet/test-wallet";
import { WalletError, type WalletAdapter } from "@/lib/wallet/types";
import { useAsk } from "./ask-dialog";
import { Badge, btn, btnGhost, input } from "./ui";

/**
 * Connects a wallet. There is no browser-wallet integration yet: the real options are
 * "sign elsewhere and paste" (manual) and, only when explicitly enabled for development, a
 * throwaway TEST wallet. No secret key is ever typed into this app.
 */
export function WalletConnect({ mode }: { mode: "signin" | "attach" }) {
  const s = useSession();
  const ask = useAsk();
  const [address, setAddress] = useState(mode === "attach" ? (s.address ?? "") : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const addrOk = /^G[A-Z2-7]{55}$/.test(address);

  async function go(make: () => Promise<WalletAdapter>) {
    setBusy(true); setErr(null);
    try {
      const w = await make();
      await (mode === "signin" ? s.signIn(w) : s.attachWallet(w));
    } catch (e) {
      setErr(e instanceof ApiError ? `${e.message} (${e.code})` : e instanceof WalletError || e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-1">Public Stellar address
        <input className={`${input} num`} value={address} readOnly={mode === "attach"} onChange={(e) => setAddress(e.target.value)} aria-invalid={address !== "" && !addrOk} />
      </label>
      {address !== "" && !addrOk && <p role="alert" className="text-red-600">That is not a valid public address (56 characters starting with G). Never enter a secret key.</p>}
      <button type="button" className={btn} disabled={!addrOk || busy} onClick={() => go(async () => new ManualWalletAdapter(ask, address.trim()))}>
        {busy ? "Waiting…" : "Sign in by signing elsewhere"}
      </button>
      {testWalletEnabled() && (
        <div className="grid gap-1">
          <p><Badge tone="warn">TEST WALLET</Badge> throwaway key in memory; transactions are not submittable on a real network.</p>
          <button type="button" className={btnGhost} disabled={busy} onClick={() => go(async () => new (await import("@/lib/wallet/test-wallet")).TestWalletAdapter())}>Use test wallet</button>
        </div>
      )}
      {err && <p role="alert" className="text-red-600">{err}</p>}
    </div>
  );
}
