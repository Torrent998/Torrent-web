"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CoveragePanel } from "@/components/coverage-panel";
import { AuditPanel } from "@/components/audit-panel";
import { HistoryPanel } from "@/components/history-panel";
import { InvitePanel } from "@/components/invite-panel";
import { SessionIntentPanel } from "@/components/intent-panel";
import { TransfersPanel } from "@/components/transfers-panel";
import { RightsTable } from "@/components/rights-table";
import { SessionGate } from "@/components/session-gate";
import { Badge, Card, ErrorBox, Loading, PageHeader, btn, btnGhost, input, label } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import type { Intent, Right } from "@/lib/api/schemas";
import { parseToBaseUnits } from "@/lib/money";
import { useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-async";

export default function CirclePage() {
  const { id } = useParams<{ id: string }>();
  return <SessionGate><CircleDetail id={id} /></SessionGate>;
}

function CircleDetail({ id }: { id: string }) {
  const { client, address } = useSession();
  const [circle] = useAsync(() => client.getCircle(id), [client, id]);
  const [cov, reloadCov] = useAsync(() => client.coverage(id), [client, id]);
  const [rights, reloadRights] = useAsync(() => client.rights(id), [client, id]);
  const [transfers, reloadTransfers] = useAsync(() => client.listTransfers(id), [client, id]);
  const [mine, reloadMine] = useAsync(() => client.listIntents(id), [client, id]);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [transferTo, setTransferTo] = useState<{ right: Right; to: string; hours: string } | null>(null);

  const guard = async (fn: () => Promise<void>, rid: string | null = null) => {
    setError(null); setBusyId(rid);
    try { await fn(); } catch (e) { setError(e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong.")); } finally { setBusyId(null); }
  };
  const units = parseToBaseUnits(amount);
  const refresh = () => { reloadCov(); reloadRights(); reloadTransfers(); reloadMine(); };
  const isOrganizer = circle.status === "ready" && circle.data.organizerAddress === address;

  const transferForm = transferTo && (
    <Card title={`Transfer right #${transferTo.right.rightId}`} description="The recipient must also approve and sign before ownership changes.">
      <form className="grid gap-3" onSubmit={(e) => {
        e.preventDefault();
        const expiresAt = new Date(Date.now() + Number(transferTo.hours) * 3600_000).toISOString();
        guard(async () => { setIntent((await client.transferIntent(transferTo.right.rightId, transferTo.to.trim(), expiresAt)).intent); setTransferTo(null); }, transferTo.right.rightId);
      }}>
        <label className={label}>Recipient (public address of another circle member)
          <input className={`${input} num`} value={transferTo.to} onChange={(e) => setTransferTo({ ...transferTo, to: e.target.value })} /></label>
        <label className={label}>Offer valid for (hours, max 720)
          <input className={input} inputMode="numeric" value={transferTo.hours} onChange={(e) => setTransferTo({ ...transferTo, hours: e.target.value })} /></label>
        <p className="text-sm text-muted">Only the on-chain owner can propose.</p>
        <div className="flex flex-wrap gap-2"><button className={btn} disabled={!/^G[A-Z2-7]{55}$/.test(transferTo.to.trim())}>Request signature</button>
          <button type="button" className={btnGhost} onClick={() => setTransferTo(null)}>Cancel</button></div>
      </form>
    </Card>
  );

  return (
    <div className="grid gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/circles" className="hover:text-fg">Circles</Link> <span aria-hidden>/</span> <span className="text-fg">{circle.status === "ready" ? circle.data.name : "…"}</span></nav>
      {circle.status === "loading" && <Loading what="circle" />}
      {circle.status === "error" && <ErrorBox error={circle.error} />}
      {circle.status === "ready" && (
        <PageHeader title={circle.data.name}
          description={<>
            <span className="mr-2 inline-flex flex-wrap gap-2 align-middle">
              {circle.data.poolId ? <Badge tone="good">Pool #{circle.data.poolId}</Badge> : <Badge tone="neutral">No on-chain pool</Badge>}
              {isOrganizer && <Badge tone="neutral">Organizer</Badge>}
            </span>
            <span className="mt-2 block text-sm">Rules hash <span className="num break-all text-fg">{circle.data.policyHash}</span></span>
          </>} />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-6">
          {cov.status === "loading" && <Loading what="coverage" />}
          {cov.status === "error" && <ErrorBox error={cov.error} onRetry={reloadCov} />}
          {cov.status === "ready" && <CoveragePanel coverage={cov.data} />}

          <Card title="Payout rights" description="Each right is backed by escrowed funds. Ownership is read from the ledger.">
            {rights.status === "loading" && <Loading what="rights" />}
            {rights.status === "error" && <ErrorBox error={rights.error} onRetry={reloadRights} />}
            {rights.status === "ready" && (
              <RightsTable rights={rights.data.rights} myAddress={address} busyId={busyId}
                onTransfer={(r) => setTransferTo({ right: r, to: "", hours: "24" })}
                onClaim={(r) => guard(async () => setIntent((await client.claimIntent(r.rightId)).intent), r.rightId)} />
            )}
            {rights.status === "ready" && rights.data.asOfLedger !== undefined && <p className="mt-3 text-xs text-muted">Ledger data as of ledger {rights.data.asOfLedger}.</p>}
          </Card>

          {transfers.status === "ready" && <TransfersPanel transfers={transfers.data.transfers} myAddress={address} client={client} onIntent={setIntent} onChanged={reloadTransfers} />}
          {transfers.status === "error" && <ErrorBox error={transfers.error} onRetry={reloadTransfers} />}

          {rights.status === "ready" && mine.status === "ready" && <HistoryPanel rights={rights.data.rights} intents={mine.data.intents} myAddress={address} />}
          {isOrganizer && <AuditPanel client={client} circleId={id} />}
        </div>

        <aside className="grid min-w-0 gap-6 lg:sticky lg:top-24" aria-label="Actions">
          {error && <ErrorBox error={error} />}
          {intent && <SessionIntentPanel key={intent.id} intent={intent} onChange={(i) => { setIntent(i); if (i.state === "CONFIRMED") refresh(); }} />}
          {transferForm}
          <Card title="Fund escrow" description="Deposit into the circle's Soroban escrow pool.">
            <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (units) guard(async () => setIntent(await client.fundingIntent(id, units))); }}>
              <label className={label}>Amount to deposit<input className={`${input} num`} inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={amount !== "" && !units} /></label>
              <button className={btn} disabled={!units || busyId !== null}>Request signature</button>
            </form>
            <p className="mt-3 text-sm text-muted">Nothing moves until you sign and the ledger confirms it.</p>
          </Card>
          {isOrganizer && <InvitePanel client={client} circleId={id} />}
        </aside>
      </div>
    </div>
  );
}
