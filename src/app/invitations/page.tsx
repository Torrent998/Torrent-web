"use client";
import Link from "next/link";
import { useState } from "react";
import { SessionGate } from "@/components/session-gate";
import { Card, ErrorBox, btn, input } from "@/components/ui";
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
  if (joined) return <Card title="You joined the circle" tone="good"><p>{joined.name}</p><Link className="underline" href={`/circles/${encodeURIComponent(joined.id)}`}>Open the circle</Link></Card>;
  return (
    <Card title="Join a circle">
      <form onSubmit={submit} className="grid gap-3">
        <label className="grid gap-1">Invitation code<input className={`${input} num`} value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" /></label>
        <button className={btn} disabled={token.trim().length < 16 || busy}>{busy ? "Joining…" : "Join"}</button>
      </form>
      <p className="mt-2 text-sm text-muted">Joining records your public address as a member. It does not move funds or sign anything on-chain.</p>
      {err && <div className="mt-3"><ErrorBox error={err} /></div>}
    </Card>
  );
}
