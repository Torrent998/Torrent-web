"use client";
import { rightRow } from "@/features/view";
import type { Right } from "@/lib/api/schemas";
import { Badge, Empty, btnGhost } from "./ui";

export interface RightsTableProps {
  rights: Right[]; myAddress: string | null; now?: Date;
  onTransfer(r: Right): void; onClaim(r: Right): void; busyId?: string | null;
}

export function RightsTable({ rights, myAddress, now = new Date(), onTransfer, onClaim, busyId }: RightsTableProps) {
  if (rights.length === 0) return <Empty>No payout rights have been issued on-chain for this circle yet.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <caption className="sr-only">Payout rights</caption>
        <thead><tr><th scope="col" className="p-2">Right</th><th scope="col" className="p-2">Amount</th><th scope="col" className="p-2">Owner</th><th scope="col" className="p-2">Status</th><th scope="col" className="p-2">Actions</th></tr></thead>
        <tbody>
          {rights.map((r) => {
            const v = rightRow(r, myAddress, now);
            return (
              <tr key={r.rightId} className="border-t border-line">
                <td className="num p-2">#{r.rightId}</td>
                <td className="num p-2">{v.amount}</td>
                <td className="p-2">{v.ownedByMe ? <Badge tone="good">You</Badge> : <span className="num text-sm">{r.owner.slice(0, 6)}…{r.owner.slice(-4)}</span>}</td>
                <td className="p-2">{v.state}{v.note ? ` · ${v.note}` : ""}</td>
                <td className="flex flex-wrap gap-2 p-2">
                  <button type="button" className={btnGhost} disabled={!v.canProposeTransfer || busyId === r.rightId} onClick={() => onTransfer(r)}>Transfer…</button>
                  <button type="button" className={btnGhost} disabled={!v.canClaim || busyId === r.rightId} onClick={() => onClaim(r)}>Claim</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
