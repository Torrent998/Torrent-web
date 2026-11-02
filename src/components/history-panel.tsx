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
      <h3 className="font-medium">Paid out (from the ledger)</h3>
      {paid.length === 0 ? <Empty>No payout has been claimed yet.</Empty> : (
        <ul className="mt-1 grid gap-1">
          {paid.map((r) => (
            <li key={r.rightId}><span className="num">#{r.rightId}</span> · <span className="num">{formatBaseUnits(r.amount)}</span> · claimed at ledger <span className="num">{r.claimedAtLedger ?? "?"}</span> · {r.owner === myAddress ? "you" : "another member"}</li>
          ))}
        </ul>
      )}
      <h3 className="mt-4 font-medium">Your requests</h3>
      {intents.length === 0 ? <Empty>You have not made any requests in this circle.</Empty> : (
        <ul className="mt-1 grid gap-1">
          {intents.map((i) => {
            const s = intentStatus(i.state);
            return <li key={i.id}>{intentTitle(i)} <Badge tone={s.tone}>{s.label}</Badge> <span className="text-sm text-muted">{i.createdAt}</span></li>;
          })}
        </ul>
      )}
    </Card>
  );
}
