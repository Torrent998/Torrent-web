"use client";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/session";
import { FreighterWalletAdapter, RpcTxPreparer, detectFreighter, loadFreighterApi, stellarRpcUrl, type FreighterApi } from "@/lib/wallet/freighter";
import { ManualWalletAdapter } from "@/lib/wallet/manual";
import { testWalletEnabled } from "@/lib/wallet/test-wallet";
import { WalletError, type WalletAdapter } from "@/lib/wallet/types";
import { useAsk } from "./ask-dialog";
import { Badge, btn, btnGhost, input, label } from "./ui";

type Detect = "checking" | "available" | "missing";

/**
 * Connects a wallet. Options, in order: the Freighter browser extension (only offered when the
 * extension answers), "sign elsewhere and paste" (works with any signer), and, only when
 * explicitly enabled for development, a throwaway TEST wallet. No secret key is ever typed here.
 */
export function WalletConnect({ mode, loadFreighter = loadFreighterApi }: { mode: "signin" | "attach"; loadFreighter?: () => Promise<FreighterApi> }) {
  const s = useSession();
  const ask = useAsk();
  const [address, setAddress] = useState(mode === "attach" ? (s.address ?? "") : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [freighter, setFreighter] = useState<{ state: Detect; api: FreighterApi | null }>({ state: "checking", api: null });
  const addrOk = /^G[A-Z2-7]{55}$/.test(address);

  useEffect(() => {
    let live = true;
    loadFreighter()
      .then(async (api) => ({ api, ok: await detectFreighter(api) }))
      .then(({ api, ok }) => { if (live) setFreighter({ state: ok ? "available" : "missing", api: ok ? api : null }); })
      .catch(() => { if (live) setFreighter({ state: "missing", api: null }); });
    return () => { live = false; };
  }, [loadFreighter]);

  async function go(make: () => Promise<WalletAdapter>) {
    setBusy(true); setErr(null);
    try {
      const w = await make();
      await (mode === "signin" ? s.signIn(w) : s.attachWallet(w));
    } catch (e) {
      setErr(e instanceof ApiError ? `${e.message} (${e.code})` : e instanceof WalletError || e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  const api = freighter.api;
  return (
    <div className="grid gap-3">
      {freighter.state === "available" && api && (
        <div className="grid gap-2 rounded-2xl border border-line bg-bg-subtle/50 p-3">
          <button type="button" className={btn} disabled={busy}
            onClick={() => go(async () => new FreighterWalletAdapter(api, new RpcTxPreparer(stellarRpcUrl()), s.networkPassphrase))}>
            {busy ? "Waiting for Freighter…" : mode === "signin" ? "Sign in with Freighter" : "Reconnect Freighter"}
          </button>
          <p className="text-xs text-muted">Freighter signs inside the extension; this app only receives signatures. Set Freighter to Testnet.</p>
        </div>
      )}
      {freighter.state === "missing" && (
        <p className="text-xs text-muted" data-testid="freighter-missing">
          Freighter browser wallet not detected. <a className="underline hover:text-fg" href="https://www.freighter.app/" target="_blank" rel="noreferrer">Get Freighter</a>, or sign elsewhere and paste below.
        </p>
      )}
      <label className={label}>Public Stellar address
        <input className={`${input} num`} value={address} readOnly={mode === "attach"} onChange={(e) => setAddress(e.target.value)} aria-invalid={address !== "" && !addrOk} />
      </label>
      {address !== "" && !addrOk && <p role="alert" className="text-(--bad-fg) text-sm font-medium">That is not a valid public address (56 characters starting with G). Never enter a secret key.</p>}
      <button type="button" className={freighter.state === "available" ? btnGhost : btn} disabled={!addrOk || busy} onClick={() => go(async () => new ManualWalletAdapter(ask, address.trim()))}>
        {busy ? "Waiting…" : "Sign in by signing elsewhere"}
      </button>
      {testWalletEnabled() && (
        <div className="grid gap-1">
          <p><Badge tone="warn">TEST WALLET</Badge> throwaway key in memory; transactions are not submittable on a real network.</p>
          <button type="button" className={btnGhost} disabled={busy} onClick={() => go(async () => new (await import("@/lib/wallet/test-wallet")).TestWalletAdapter())}>Use test wallet</button>
        </div>
      )}
      {err && <p role="alert" className="text-(--bad-fg) text-sm font-medium">{err}</p>}
    </div>
  );
}
