"use client";
import { useEffect, useState } from "react";
import { describeDescriptor, intentStatus, intentTitle, secondsLeft } from "@/features/view";
import { ApiError, type ApiClient } from "@/lib/api/client";
import type { Intent } from "@/lib/api/schemas";
import { Badge, Card, ErrorBox, btn, input } from "./ui";

export interface IntentPanelProps {
  intent: Intent;
  client: ApiClient;
  onChange?(i: Intent): void;
  pollMs?: number;
  now?: () => Date;
}

/**
 * Shows exactly what the user is asked to sign, and the true settlement state. There is no
 * wallet integration yet: the signed transaction (base64 XDR) is pasted in. The app never sees keys.
 */
export function IntentPanel({ intent: initial, client, onChange, pollMs = 5000, now = () => new Date() }: IntentPanelProps) {
  const [intent, setIntent] = useState(initial);
  const [xdr, setXdr] = useState("");
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

  async function submit() {
    setBusy(true); setError(null);
    try { update((await client.submitIntent(intent.id, xdr.trim())).intent); setXdr(""); }
    catch (e) { setError(e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong.")); }
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
              <p className="text-sm">Expires in <span className="num">{Math.floor(left / 60)}m {left % 60}s</span>. Sign exactly the call shown above with your wallet, then paste the signed transaction (base64 XDR).</p>
              <label className="grid gap-1">Signed transaction (XDR)
                <textarea className={`${input} num h-28`} value={xdr} onChange={(e) => setXdr(e.target.value)} spellCheck={false} />
              </label>
              <button type="button" className={btn} disabled={busy || xdr.trim().length < 100} onClick={submit}>{busy ? "Submitting…" : "Submit signed transaction"}</button>
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
