"use client";
import { formatBaseUnits } from "@/lib/money";
import { intentStatus, intentTitle } from "@/features/view";
import type { Intent, Right } from "@/lib/api/schemas";
import { Badge, Card, Empty } from "./ui";

/** Claim history = rights the ledger reports as paid out, plus the caller's own request log. */
export function HistoryPanel({ rights, intents, myAddress }: { rights: Right[]; intents: Intent[]; myAddress: string | null }) {
  const paid = rights.filter((r) => r.state === "Claimed");
  return (
    <Card title="Claims and activity">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">Paid out (from the ledger)</h3>
      {paid.length === 0 ? <Empty>No payout has been claimed yet.</Empty> : (
        <ul className="grid divide-y divide-line">
          {paid.map((r) => (
            <li key={r.rightId} className="py-2"><span className="num">#{r.rightId}</span> · <span className="num">{formatBaseUnits(r.amount)}</span> · claimed at ledger <span className="num">{r.claimedAtLedger ?? "?"}</span> · {r.owner === myAddress ? "you" : "another member"}</li>
          ))}
        </ul>
      )}
      <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-muted">Your requests</h3>
      {intents.length === 0 ? <Empty>You have not made any requests in this circle.</Empty> : (
        <ul className="grid divide-y divide-line">
          {intents.map((i) => {
            const s = intentStatus(i.state);
            return <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5"><span className="font-medium">{intentTitle(i)}</span> <Badge tone={s.tone}>{s.label}</Badge> <span className="num ml-auto text-xs text-muted">{i.createdAt}</span></li>;
          })}
        </ul>
      )}
    </Card>
  );
}
