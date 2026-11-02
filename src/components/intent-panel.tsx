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
    <Card title={intentTitle(intent)} tone={st.tone} actions={<Badge tone={st.tone}>{st.label}</Badge>}>
      <Progress state={intent.state} />
      <p className="mt-4">{st.explain}</p>
      <div className="mt-4 rounded-2xl border border-line bg-bg-subtle p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Exact contract call</p>
        <p className="num mt-1.5 break-words text-sm">{describeDescriptor(intent)}</p>
      </div>
      {intent.state === "AWAITING_SIGNATURE" && (
        <div className="mt-4 grid gap-3">
          {expired ? (
            <p role="alert" className="font-medium text-(--bad-fg)">This request expired. Create a new one; the old approval cannot be used.</p>
          ) : (
            <>
              <p className="text-sm">Expires in <span className="num font-medium">{Math.floor(left / 60)}m {left % 60}s</span>. Your wallet will show the exact call above; check it before approving.</p>
              {wallet ? (
                <>
                  {wallet.isTestAdapter && <p className="text-sm"><Badge tone="warn">TEST WALLET</Badge> Not a real wallet; the signed transaction is not submittable on a real network.</p>}
                  <button type="button" className={btn} disabled={busy} onClick={signAndSubmit}>{busy ? "Waiting for wallet…" : `Sign and submit with ${wallet.label}`}</button>
                </>
              ) : (
                <div><p className="mb-2">Reconnect your wallet to sign.</p>{reconnect}</div>
              )}
            </>
          )}
        </div>
      )}
      {intent.txHash && <p className="num mt-3 break-all text-xs text-muted">Transaction: {intent.txHash}</p>}
      {intent.state === "FAILED" && intent.failureReason && <p className="mt-3 text-sm">Reason: <span className="num">{intent.failureReason}</span></p>}
      {error && <div className="mt-4"><ErrorBox error={error} /></div>}
    </Card>
  );
}

const STEPS = ["Sign", "Submit", "Ledger confirms"] as const;
function stepIndex(state: Intent["state"]): number {
  switch (state) {
    case "CONFIRMED": return 3;
    case "SUBMITTED": case "RECONCILING": return 2;
    case "AWAITING_SIGNATURE": return 0;
    default: return -1;
  }
}

/** Where the request is in the signing lifecycle. Nothing is "done" until the ledger confirms it. */
function Progress({ state }: { state: Intent["state"] }) {
  const at = stepIndex(state);
  if (at < 0) return null;
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done = i < at;
        const current = i === at;
        return (
          <li key={label} aria-current={current ? "step" : undefined} className="grid gap-1.5">
            <span aria-hidden className={`h-1.5 rounded-full ${done ? "bg-brand" : current ? "bg-brand/40" : "bg-bg-subtle"}`} />
            <span className={`text-xs ${done || current ? "font-semibold" : "text-muted"}`}>{label}{done ? " ✓" : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** IntentPanel wired to the signed-in session's wallet (with reconnect when the wallet is gone). */
export function SessionIntentPanel(props: Omit<IntentPanelProps, "wallet" | "networkPassphrase" | "reconnect" | "client">) {
  const s = useSession();
  return <IntentPanel {...props} client={s.client} wallet={s.wallet} networkPassphrase={s.networkPassphrase} reconnect={<WalletConnect mode="attach" />} />;
}
