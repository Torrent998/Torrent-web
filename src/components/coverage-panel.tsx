"use client";
import { coverageView } from "@/features/view";
import type { Coverage } from "@/lib/api/schemas";
import { Card } from "./ui";

/** Share of `part` in `whole` as a percentage with 0.1% precision, computed on integers. */
export function share(part: string, whole: string): number {
  const w = BigInt(whole);
  if (w <= 0n) return 0;
  const p = BigInt(part);
  if (p <= 0n) return 0;
  return Number((p * 1000n) / w) / 10;
}

export function CoveragePanel({ coverage }: { coverage: Coverage }) {
  const v = coverageView(coverage);
  const segments = coverage.bound ? [
    { key: "reserved", label: "Reserved for rights", pct: share(coverage.totals.reserved, coverage.totals.funded), cls: "bg-brand" },
    { key: "unreserved", label: "Unreserved", pct: share(coverage.unreserved, coverage.totals.funded), cls: "bg-accent" },
    { key: "claimed", label: "Paid out", pct: share(coverage.totals.claimed, coverage.totals.funded), cls: "bg-muted/50" },
    { key: "withdrawn", label: "Withdrawn", pct: share(coverage.totals.withdrawn, coverage.totals.funded), cls: "bg-line-strong" },
  ] : [];
  return (
    <Card title="Escrow coverage" tone={v.tone}>
      <p className="font-semibold">{v.headline}</p>
      {v.detail.map((d) => <p key={d} className="mt-1 text-sm">{d}</p>)}
      {segments.some((s) => s.pct > 0) && (
        <div className="mt-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-bg-subtle" aria-hidden>
            {segments.map((s) => s.pct > 0 && <div key={s.key} className={`${s.cls} h-full transition-[width] duration-700`} style={{ width: `${s.pct}%` }} />)}
          </div>
          <p className="sr-only">{segments.map((s) => `${s.label} ${s.pct}% of funded`).join(", ")}</p>
        </div>
      )}
      {v.numbers && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
          {v.numbers.map((n) => (
            <div key={n.label} className="rounded-2xl bg-bg-subtle px-3 py-2.5"><dt className="text-xs text-muted">{n.label}</dt><dd className="num mt-0.5 text-lg">{n.value}</dd></div>
          ))}
        </dl>
      )}
      {v.freshness && <p className="mt-3 text-xs text-muted">{v.freshness}. Derived from the ledger, not from this app.</p>}
    </Card>
  );
}
