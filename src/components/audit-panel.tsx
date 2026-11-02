"use client";
import { useState } from "react";
import { ApiError, type ApiClient } from "@/lib/api/client";
import type { AuditEntry } from "@/lib/api/schemas";
import { Card, Empty, ErrorBox, btnGhost } from "./ui";

/** Organizer / auditor view of the append-only audit trail (actor, action, object, request id; never secrets). */
export function AuditPanel({ client, circleId }: { client: ApiClient; circleId: string }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, setMore] = useState(true);
  const [err, setErr] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true); setErr(null);
    try {
      const p = await client.audit(circleId, cursor ?? undefined, 20);
      setEntries([...(entries ?? []), ...p.events]); setCursor(p.nextCursor); setMore(p.events.length === 20);
    } catch (x) { setErr(x instanceof ApiError ? x : new ApiError(0, "UNKNOWN", "Something went wrong.")); }
    finally { setBusy(false); }
  }
  return (
    <Card title="Audit trail" description="Append-only. Actor, action, object and request id; never secrets.">
      {entries === null ? <button type="button" className={btnGhost} onClick={load} disabled={busy}>Load audit trail</button> : entries.length === 0 ? <Empty>No entries.</Empty> : (
        <>
          <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Audit events</caption>
            <thead className="text-xs uppercase tracking-wider text-muted"><tr><th scope="col" className="px-2 py-2">Time</th><th scope="col" className="px-2 py-2">Actor</th><th scope="col" className="px-2 py-2">Action</th><th scope="col" className="px-2 py-2">Object</th><th scope="col" className="px-2 py-2">Request</th></tr></thead>
            <tbody>{entries.map((e) => (
              <tr key={e.id} className="border-t border-line"><td className="num px-2 py-2 text-xs">{e.at}</td><td className="num px-2 py-2 text-xs">{e.actor}</td><td className="px-2 py-2">{e.action}</td><td className="num px-2 py-2 text-xs">{e.object}</td><td className="num px-2 py-2 text-xs">{e.requestId}</td></tr>
            ))}</tbody>
          </table></div>
          {more && <button type="button" className={`${btnGhost} mt-2`} onClick={load} disabled={busy}>Load more</button>}
        </>
      )}
      {err && <div className="mt-3"><ErrorBox error={err} /></div>}
    </Card>
  );
}
