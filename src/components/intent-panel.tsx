"use client";
import { useEffect, useState, type ReactNode } from "react";
import { describeDescriptor, intentStatus, intentTitle, secondsLeft } from "@/features/view";
import { ApiError, type ApiClient } from "@/lib/api/client";
import type { Intent } from "@/lib/api/schemas";
import { useSession } from "@/lib/session";
import type { WalletAdapter } from "@/lib/wallet/types";
import { WalletConnect } from "./wallet-connect";
import { Badge, Card, ErrorBox, btn } from "./ui";

export interface IntentPanelProps {
  intent: Intent;
  client: ApiClient;
  onChange?(i: Intent): void;
  pollMs?: number;
  now?: () => Date;
  /** Signer. When null (e.g. after a reload) `reconnect` is shown instead of a sign button. */
  wallet: WalletAdapter | null;
  networkPassphrase: string;
  reconnect?: ReactNode;
}

/**
 * Shows exactly what the user is asked to sign, and the true settlement state. There is no
 * wallet integration yet: the signed transaction (base64 XDR) is pasted in. The app never sees keys.
 */
export function IntentPanel({ intent: initial, client, onChange, pollMs = 5000, now = () => new Date(), wallet, networkPassphrase, reconnect }: IntentPanelProps) {
  const [intent, setIntent] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [, tick] = useState(0);

  const update = (i: Intent) => { setIntent(i); onChange?.(i); };
  const st = intentStatus(intent.state);

  useEffect(() => {
    if (intent.state !== "SUBMITTED" && intent.state !== "RECONCILING" && intent.state !== "AWAITING_SIGNATURE") return;
    const id = setInterval(async () => {
      tick((n) => n + 1);
      if (intent.state === "AWAITING_SIGNATURE") return;
      try { update(await client.getIntent(intent.id)); } catch { /* keep showing last known state; next poll retries */ }
    }, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent.id, intent.state, pollMs]);

  async function signAndSubmit() {
    if (!wallet) return;
    setBusy(true); setError(null);
    try {
      const signed = await wallet.signIntent(intent, networkPassphrase);
      update((await client.submitIntent(intent.id, signed)).intent);
    }
    catch (e) { setError(e instanceof ApiError ? e : new ApiError(0, e instanceof Error && e.name === "WalletError" ? "WALLET" : "UNKNOWN", e instanceof Error ? e.message : "Something went wrong.")); }
    finally { setBusy(false); }
  }

  const left = secondsLeft(intent.expiresAt, now());
  const expired = intent.state === "AWAITING_SIGNATURE" && left === 0;
  return (
    <Card title={intentTitle(intent)} tone={st.tone}>
      <p><Badge tone={st.tone}>{st.label}</Badge></p>
      <p className="mt-2">{st.explain}</p>
      <p className="num mt-2 break-words text-sm text-muted">{describeDescriptor(intent)}</p>
      {intent.state === "AWAITING_SIGNATURE" && (
        <div className="mt-3 grid gap-2">
          {expired ? (
            <p role="alert">This request expired. Create a new one; the old approval cannot be used.</p>
          ) : (
            <>
              <p className="text-sm">Expires in <span className="num">{Math.floor(left / 60)}m {left % 60}s</span>. Your wallet will show the exact call above; check it before approving.</p>
              {wallet ? (
                <>
                  {wallet.isTestAdapter && <p><Badge tone="warn">TEST WALLET</Badge> Not a real wallet; the signed transaction is not submittable on a real network.</p>}
                  <button type="button" className={btn} disabled={busy} onClick={signAndSubmit}>{busy ? "Waiting for wallet…" : `Sign and submit with ${wallet.label}`}</button>
                </>
              ) : (
                <div><p className="mb-2">Reconnect your wallet to sign.</p>{reconnect}</div>
              )}
            </>
          )}
        </div>
      )}
      {intent.txHash && <p className="num mt-2 break-all text-sm">Transaction: {intent.txHash}</p>}
      {intent.state === "FAILED" && intent.failureReason && <p className="mt-2 text-sm">Reason: <span className="num">{intent.failureReason}</span></p>}
      {error && <div className="mt-3"><ErrorBox error={error} /></div>}
    </Card>
  );
}

/** IntentPanel wired to the signed-in session's wallet (with reconnect when the wallet is gone). */
export function SessionIntentPanel(props: Omit<IntentPanelProps, "wallet" | "networkPassphrase" | "reconnect" | "client">) {
  const s = useSession();
  return <IntentPanel {...props} client={s.client} wallet={s.wallet} networkPassphrase={s.networkPassphrase} reconnect={<WalletConnect mode="attach" />} />;
}
