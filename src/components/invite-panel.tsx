"use client";
import { useState } from "react";
import { ApiError, type ApiClient } from "@/lib/api/client";
import { Card, ErrorBox, btn, input, label as labelCls } from "./ui";

/** Organizer-only. The invitation secret is shown once; the server keeps only its hash. */
export function InvitePanel({ client, circleId }: { client: ApiClient; circleId: string }) {
  const [label, setLabel] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [expires, setExpires] = useState("");
  const [err, setErr] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try { const r = await client.createInvitation(circleId, label.trim()); setToken(r.token); setExpires(r.invitation.expiresAt); setLabel(""); }
    catch (x) { setErr(x instanceof ApiError ? x : new ApiError(0, "UNKNOWN", "Something went wrong.")); }
    finally { setBusy(false); }
  }
  return (
    <Card title="Invite a member" description="Organizer only. Each code is single-use and expires.">
      <form onSubmit={create} className="grid gap-3">
        <label className={labelCls}>Who is this for? (a private note, not shared on-chain)<input className={input} value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} /></label>
        <button className={btn} disabled={!label.trim() || busy}>Create invitation</button>
      </form>
      {token && (
        <div role="status" className="tone-warn mt-4 rounded-2xl border border-(--t-line)/60 bg-(--t-bg) p-4">
          <p className="font-semibold text-(--t-fg)">Copy this invitation code now. It is shown once and cannot be recovered.</p>
          <p className="num mt-2 break-all rounded-xl bg-card p-2.5 text-sm select-all">{token}</p>
          <p className="mt-2 text-xs text-muted">Expires {expires}. Send it privately; whoever holds it can join.</p>
        </div>
      )}
      {err && <div className="mt-3"><ErrorBox error={err} /></div>}
    </Card>
  );
}
