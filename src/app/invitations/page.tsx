"use client";
import Link from "next/link";
import { useState } from "react";
import { SessionGate } from "@/components/session-gate";
import { Card, ErrorBox, PageHeader, btn, input, label } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import type { Circle } from "@/lib/api/schemas";
import { useSession } from "@/lib/session";

export default function AcceptInvitationPage() {
  return <SessionGate><Accept /></SessionGate>;
}

function Accept() {
  const { client } = useSession();
  const [token, setToken] = useState("");
  const [joined, setJoined] = useState<Circle | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try { setJoined(await client.acceptInvitation(token.trim())); }
    catch (x) { setErr(x instanceof ApiError ? x : new ApiError(0, "UNKNOWN", "Something went wrong.")); }
    finally { setBusy(false); }
  }
  if (joined) return (
    <div className="mx-auto max-w-xl">
      <Card title="You joined the circle" tone="good">
        <p className="text-lg font-semibold">{joined.name}</p>
        <Link className={`${btn} mt-4`} href={`/circles/${encodeURIComponent(joined.id)}`}>Open the circle</Link>
      </Card>
    </div>
  );
  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <PageHeader eyebrow="Invitation" title="Join a circle" description="Paste the invitation code an organizer sent you privately." />
      <Card title="Enter your code">
        <form onSubmit={submit} className="grid gap-3">
          <label className={label}>Invitation code<input className={`${input} num`} value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" spellCheck={false} /></label>
          <button className={btn} disabled={token.trim().length < 16 || busy}>{busy ? "Joining…" : "Join"}</button>
        </form>
        <p className="mt-3 text-sm text-muted">Joining records your public address as a member. It does not move funds or sign anything on-chain.</p>
        {err && <div className="mt-4"><ErrorBox error={err} /></div>}
      </Card>
    </div>
  );
}
