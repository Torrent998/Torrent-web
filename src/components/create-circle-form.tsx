"use client";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import type { Circle } from "@/lib/api/schemas";
import { parseToBaseUnits } from "@/lib/money";
import { useSession } from "@/lib/session";
import { ErrorBox, btn, input, label } from "./ui";

export function CreateCircleForm({ onCreated }: { onCreated(c: Circle): void }) {
  const { client } = useSession();
  const [f, setF] = useState({ name: "", token: "", members: "5", rounds: "5", days: "30", amount: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);
  const amount = parseToBaseUnits(f.amount);
  const valid = f.name.trim() !== "" && /^C[A-Z2-7]{55}$/.test(f.token) && amount !== null && +f.members >= 2 && +f.rounds >= 1 && +f.days >= 1;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || amount === null) return;
    setBusy(true); setErr(null);
    try {
      onCreated(await client.createCircle({ name: f.name.trim(), ruleSet: {
        tokenContractId: f.token, maxMembers: +f.members, rounds: +f.rounds, roundLengthDays: +f.days,
        contributionAmount: amount, transferPolicy: "MEMBERS_ONLY" } }));
    } catch (x) { setErr(x instanceof ApiError ? x : new ApiError(0, "UNKNOWN", "Something went wrong.")); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="grid gap-3" aria-label="Create circle">
      <label className={label}>Circle name<input className={input} value={f.name} onChange={set("name")} maxLength={80} /></label>
      <label className={label}>Testnet asset contract (starts with C)<input className={`${input} num`} value={f.token} onChange={set("token")} /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={label}>Max members<input className={input} inputMode="numeric" value={f.members} onChange={set("members")} /></label>
        <label className={label}>Rounds<input className={input} inputMode="numeric" value={f.rounds} onChange={set("rounds")} /></label>
        <label className={label}>Round length (days)<input className={input} inputMode="numeric" value={f.days} onChange={set("days")} /></label>
      </div>
      <label className={label}>Contribution per round (up to 7 decimals)
        <input className={`${input} num`} inputMode="decimal" value={f.amount} onChange={set("amount")} aria-invalid={f.amount !== "" && amount === null} />
      </label>
      {f.amount !== "" && amount === null && <p role="alert" className="text-(--bad-fg) text-sm font-medium">Enter a positive amount with at most 7 decimal places.</p>}
      <p className="text-sm text-muted">The rules are hashed; the same hash must be used when the organizer creates the escrow pool on-chain, which is how the circle is bound to it.</p>
      <button className={btn} disabled={!valid || busy}>{busy ? "Creating…" : "Create circle"}</button>
      {err && <ErrorBox error={err} />}
    </form>
  );
}
