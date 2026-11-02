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
    <Card title="Audit trail">
      {entries === null ? <button type="button" className={btnGhost} onClick={load} disabled={busy}>Load audit trail</button> : entries.length === 0 ? <Empty>No entries.</Empty> : (
        <>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <caption className="sr-only">Audit events</caption>
            <thead><tr><th scope="col" className="p-1">Time</th><th scope="col" className="p-1">Actor</th><th scope="col" className="p-1">Action</th><th scope="col" className="p-1">Object</th><th scope="col" className="p-1">Request</th></tr></thead>
            <tbody>{entries.map((e) => (
              <tr key={e.id} className="border-t border-line"><td className="num p-1">{e.at}</td><td className="num p-1">{e.actor}</td><td className="p-1">{e.action}</td><td className="num p-1">{e.object}</td><td className="num p-1">{e.requestId}</td></tr>
            ))}</tbody>
          </table></div>
          {more && <button type="button" className={`${btnGhost} mt-2`} onClick={load} disabled={busy}>Load more</button>}
        </>
      )}
      {err && <div className="mt-3"><ErrorBox error={err} /></div>}
    </Card>
  );
}
