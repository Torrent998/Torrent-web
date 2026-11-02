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
      <table className="w-full text-left text-sm max-sm:block sm:min-w-[34rem]">
        <caption className="sr-only">Payout rights</caption>
        <thead className="text-xs uppercase tracking-wider text-muted max-sm:sr-only"><tr><th scope="col" className="px-2 pb-2 font-semibold">Right</th><th scope="col" className="px-2 pb-2 font-semibold">Amount</th><th scope="col" className="px-2 pb-2 font-semibold">Owner</th><th scope="col" className="px-2 pb-2 font-semibold">Status</th><th scope="col" className="px-2 pb-2 text-right font-semibold">Actions</th></tr></thead>
        <tbody className="max-sm:grid max-sm:gap-3">
          {rights.map((r) => {
            const v = rightRow(r, myAddress, now);
            return (
              <tr key={r.rightId} className="border-t border-line transition-colors hover:bg-bg-subtle/60 max-sm:grid max-sm:grid-cols-[auto_1fr_auto] max-sm:items-center max-sm:gap-x-3 max-sm:rounded-2xl max-sm:border max-sm:p-3">
                <td className="num px-2 py-3 font-medium max-sm:p-0">#{r.rightId}</td>
                <td className="num px-2 py-3 text-base max-sm:p-0">{v.amount}</td>
                <td className="px-2 py-3 max-sm:p-0 max-sm:text-right">{v.ownedByMe ? <Badge tone="good">You</Badge> : <span className="num">{r.owner.slice(0, 6)}…{r.owner.slice(-4)}</span>}</td>
                <td className="px-2 py-3 max-sm:col-span-3 max-sm:px-0 max-sm:pb-0 max-sm:pt-2"><span className="font-medium">{v.state}</span>{v.note ? <span className="text-muted"> · {v.note}</span> : ""}</td>
                <td className="flex flex-wrap justify-end gap-2 px-2 py-3 max-sm:col-span-3 max-sm:justify-stretch max-sm:px-0 max-sm:pb-0 max-sm:[&>button]:flex-1">
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
