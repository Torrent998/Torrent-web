"use client";
import Link from "next/link";
import { useState } from "react";
import { CreateCircleForm } from "@/components/create-circle-form";
import { SessionGate } from "@/components/session-gate";
import { Card, Empty, ErrorBox, Loading, btnGhost } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-async";

export default function CirclesPage() {
  return <SessionGate><CircleList /></SessionGate>;
}

function CircleList() {
  const { client, setCredentials } = useSession();
  const [state, reload] = useAsync(() => client.listCircles(), [client]);
  const [creating, setCreating] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Your circles</h1>
        <button className={`${btnGhost} ml-auto`} onClick={() => setCreating(!creating)}>{creating ? "Close" : "New circle"}</button>
        <button className={btnGhost} onClick={() => setCredentials(null, null)}>Sign out</button>
      </div>
      {creating && <Card title="New circle"><CreateCircleForm onCreated={() => { setCreating(false); reload(); }} /></Card>}
      {state.status === "loading" && <Loading what="circles" />}
      {state.status === "error" && <ErrorBox error={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.circles.length === 0 && <Empty>You are not in any circle yet. Create one, or ask an organizer for an invitation.</Empty>}
      {state.status === "ready" && (
        <ul className="grid gap-3">
          {state.data.circles.map((c) => (
            <li key={c.id}>
              <Card>
                <Link href={`/circles/${encodeURIComponent(c.id)}`} className="text-lg font-semibold underline">{c.name}</Link>
                <p className="text-sm text-muted">{c.members.length}/{c.ruleSet.maxMembers} members · {c.poolId ? "pool bound on-chain" : "no on-chain pool yet"}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
