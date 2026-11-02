"use client";
import { coverageView } from "@/features/view";
import type { Coverage } from "@/lib/api/schemas";
import { Card } from "./ui";

export function CoveragePanel({ coverage }: { coverage: Coverage }) {
  const v = coverageView(coverage);
  return (
    <Card title="Escrow coverage" tone={v.tone}>
      <p className="font-medium">{v.headline}</p>
      {v.detail.map((d) => <p key={d} className="mt-1 text-sm">{d}</p>)}
      {v.numbers && (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {v.numbers.map((n) => (
            <div key={n.label}><dt className="text-sm text-muted">{n.label}</dt><dd className="num text-lg">{n.value}</dd></div>
          ))}
        </dl>
      )}
      {v.freshness && <p className="mt-2 text-sm text-muted">{v.freshness}. Derived from the ledger, not from this app.</p>}
    </Card>
  );
}
