"use client";
import Link from "next/link";
import { useState } from "react";
import { CreateCircleForm } from "@/components/create-circle-form";
import { IconArrowRight, IconPlus, IconUsers } from "@/components/icons";
import { SessionGate } from "@/components/session-gate";
import { Badge, Card, Empty, ErrorBox, Loading, PageHeader, btn, btnGhost } from "@/components/ui";
import { formatBaseUnits } from "@/lib/money";
import { useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-async";

export default function CirclesPage() {
  return <SessionGate><CircleList /></SessionGate>;
}

function CircleList() {
  const { client, signOut, address } = useSession();
  const [state, reload] = useAsync(() => client.listCircles(), [client]);
  const [creating, setCreating] = useState(false);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Dashboard" title="Your circles"
        description={address ? <>Signed in as <span className="num break-all text-fg">{address.slice(0, 6)}…{address.slice(-4)}</span> on Stellar Testnet.</> : undefined}
        actions={<>
          <button className={btn} onClick={() => setCreating(!creating)} aria-expanded={creating}>{creating ? "Close" : <><IconPlus width={18} height={18} />New circle</>}</button>
          <button className={btnGhost} onClick={() => signOut()}>Sign out</button>
        </>} />
      {creating && <Card title="New circle" description="Rules are fixed once the pool is funded. Choose carefully."><CreateCircleForm onCreated={() => { setCreating(false); reload(); }} /></Card>}
      {state.status === "loading" && <Loading what="circles" />}
      {state.status === "error" && <ErrorBox error={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.circles.length === 0 && <Empty>You are not in any circle yet. Create one, or ask an organizer for an invitation.</Empty>}
      {state.status === "ready" && state.data.circles.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.data.circles.map((c) => (
            <li key={c.id}>
              <Link href={`/circles/${encodeURIComponent(c.id)}`}
                className="group flex h-full flex-col rounded-3xl border border-line bg-card p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand/60 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><IconUsers /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold">{c.name}</p>
                    <p className="text-sm text-muted">{c.members.length}/{c.ruleSet.maxMembers} members · {c.poolId ? "pool bound on-chain" : "no on-chain pool yet"}</p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
                  <div><dt className="text-xs text-muted">Rounds</dt><dd className="num mt-0.5">{c.ruleSet.rounds}</dd></div>
                  <div><dt className="text-xs text-muted">Every</dt><dd className="num mt-0.5">{c.ruleSet.roundLengthDays}d</dd></div>
                  <div><dt className="text-xs text-muted">Contribution</dt><dd className="num mt-0.5 truncate">{formatBaseUnits(c.ruleSet.contributionAmount)}</dd></div>
                </dl>
                <div className="mt-5 flex items-center justify-between">
                  {c.poolId ? <Badge tone="good">Pool #{c.poolId}</Badge> : <Badge tone="neutral">Not bound</Badge>}
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text">Open <IconArrowRight width={16} height={16} className="transition-transform group-hover:translate-x-0.5" /></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
