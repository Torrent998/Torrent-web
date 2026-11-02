"use client";
import { useState } from "react";
import type { Tone } from "@/features/view";
import { ApiError, type ApiClient } from "@/lib/api/client";
import type { Intent, TransferRecord } from "@/lib/api/schemas";
import { Badge, Card, Empty, ErrorBox, btn } from "./ui";

const STATUS: Record<TransferRecord["status"], { label: string; tone: Tone }> = {
  PROPOSING: { label: "Proposal waiting for the owner's signature / ledger confirmation", tone: "pending" },
  AWAITING_RECIPIENT: { label: "Proposed on-chain, waiting for the recipient", tone: "warn" },
  ACCEPTING: { label: "Recipient is accepting (not final until confirmed)", tone: "pending" },
  COMPLETED: { label: "Completed: ownership changed on-chain", tone: "good" },
  FAILED: { label: "Failed: nothing changed", tone: "bad" },
};
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/**
 * Transfer proposals in the circle. The named recipient can approve an on-chain proposal, which
 * creates the accept-transfer signing request. Approval does not move ownership by itself.
 */
export function TransfersPanel({ transfers, myAddress, client, onIntent, onChanged }: {
  transfers: TransferRecord[]; myAddress: string | null; client: ApiClient; onIntent(i: Intent): void; onChanged?(): void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);
  async function approve(t: TransferRecord) {
    setBusy(t.id); setErr(null);
    try { onIntent((await client.approveTransfer(t.id)).intent); onChanged?.(); }
    catch (x) { setErr(x instanceof ApiError ? x : new ApiError(0, "UNKNOWN", "Something went wrong.")); }
    finally { setBusy(null); }
  }
  return (
    <Card title="Right transfers">
      {transfers.length === 0 ? <Empty>No transfer proposals in this circle.</Empty> : (
        <ul className="grid gap-3">
          {transfers.map((t) => {
            const s = STATUS[t.status];
            const incoming = myAddress !== null && t.to === myAddress && t.status === "AWAITING_RECIPIENT";
            return (
              <li key={t.id} className="rounded-2xl border border-line bg-bg-subtle/50 p-4">
                <p className="font-medium">Right <span className="num">#{t.rightId}</span>: <span className="num">{t.from === myAddress ? "you" : short(t.from)}</span> → <span className="num">{t.to === myAddress ? "you" : short(t.to)}</span></p>
                <p className="mt-2"><Badge tone={s.tone}>{s.label}</Badge></p>
                <p className="mt-2 text-xs text-muted">Offer expires <span className="num">{t.expiresAt}</span></p>
                {incoming && (
                  <button type="button" className={`${btn} mt-3`} disabled={busy === t.id} onClick={() => approve(t)}>
                    {busy === t.id ? "Preparing…" : "Review and approve"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {err && <div className="mt-3"><ErrorBox error={err} /></div>}
    </Card>
  );
}
