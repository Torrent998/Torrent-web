import type { ContractInfo, Coverage, Intent, IntentState, Right } from "@/lib/api/schemas";
import { formatBaseUnits } from "@/lib/money";

export type Tone = "neutral" | "pending" | "good" | "bad" | "warn";

/**
 * Honest status copy. Nothing is shown as settled until the ledger confirmation is observed:
 * SUBMITTED means "sent, not yet seen on the ledger".
 */
export function intentStatus(state: IntentState): { label: string; tone: Tone; final: boolean; explain: string } {
  switch (state) {
    case "DRAFT": return { label: "Draft", tone: "neutral", final: false, explain: "Being prepared." };
    case "VERIFIED": return { label: "Checked", tone: "neutral", final: false, explain: "The server checked your request against ledger data." };
    case "AWAITING_SIGNATURE": return { label: "Needs your signature", tone: "warn", final: false, explain: "Nothing has happened on-chain. Sign the request below before it expires." };
    case "SUBMITTED": return { label: "Submitted, not yet confirmed", tone: "pending", final: false, explain: "Sent to Stellar. It is not settled until the ledger confirmation is observed." };
    case "RECONCILING": return { label: "Checking the ledger", tone: "pending", final: false, explain: "The outcome is not yet known. It will not be retried with different parameters; it resolves by transaction hash." };
    case "CONFIRMED": return { label: "Confirmed on-chain", tone: "good", final: true, explain: "Observed on the ledger by the indexer." };
    case "FAILED": return { label: "Failed", tone: "bad", final: true, explain: "No change was made on-chain by this request. Start a new request to try again." };
  }
}

export const intentTitle = (i: Pick<Intent, "kind">): string =>
  ({
    FUNDING: "Fund escrow", TRANSFER_PROPOSE: "Propose right transfer", TRANSFER_ACCEPT: "Accept right transfer",
    TRANSFER_CANCEL: "Withdraw transfer offer", CLAIM: "Claim payout", POOL_LEAVE: "Leave the pool",
  })[i.kind];

export function secondsLeft(expiresAt: string, now: Date): number {
  return Math.max(0, Math.floor((Date.parse(expiresAt) - now.getTime()) / 1000));
}

export interface CoverageView {
  tone: Tone;
  headline: string;
  detail: string[];
  freshness: string;
  numbers: { label: string; value: string }[] | null;
}

export function coverageView(c: Coverage, decimals = 7): CoverageView {
  if (!c.bound) {
    return { tone: "neutral", headline: "No on-chain pool yet", numbers: null, freshness: "",
      detail: ["Coverage appears after the organizer creates the pool on Stellar Testnet with this circle's policy hash and the API binds it."] };
  }
  const f = (v: string) => formatBaseUnits(v, decimals);
  const numbers = [
    { label: "Funded (escrowed)", value: f(c.totals.funded) },
    { label: "Reserved for rights", value: f(c.totals.reserved) },
    { label: "Paid out", value: f(c.totals.claimed) },
    { label: "Withdrawn", value: f(c.totals.withdrawn) },
    { label: "Unreserved", value: f(c.unreserved) },
  ];
  const detail: string[] = [];
  let tone: Tone = "good";
  let headline = "Fully backed: every issued right is covered by escrowed funds";
  if (!c.fullyBacked) { tone = "bad"; headline = "Coverage problem: reserved value exceeds escrow"; detail.push("This should be impossible on-chain. Do not transact; the indexer is reconciling."); }
  if (c.indexerStatus === "RECONCILING") { tone = "bad"; headline = "Ledger data is under reconciliation"; detail.push("Sensitive actions are paused until the discrepancy is resolved."); }
  else if (c.indexerStatus === "SYNCING" || c.lagLedgers > 0) { if (tone === "good") tone = "warn"; detail.push(`Ledger data is ${c.lagLedgers} ledger(s) behind; numbers may be out of date.`); }
  if (c.poolStatus === "Paused") { if (tone === "good") tone = "warn"; detail.push("The pool is paused: deposits, issuance and transfers are disabled; claims still work."); }
  if (c.poolStatus === "Closed") { if (tone === "good") tone = "warn"; detail.push("The pool is closed: no new funding, rights or transfers. Every issued right is still paid at maturity."); }
  return { tone, headline, detail, numbers, freshness: `As of ledger ${c.asOfLedger} (Stellar Testnet)` };
}

export interface RightRowView {
  id: string; amount: string; ownedByMe: boolean; maturity: Date; matured: boolean; state: Right["state"];
  canProposeTransfer: boolean; canClaim: boolean; note: string;
}

/** Action availability is advisory UX only; the server and the contract make the real decision. */
export function rightRow(r: Right, myAddress: string | null, now: Date, decimals = 7): RightRowView {
  const ownedByMe = myAddress !== null && r.owner === myAddress;
  const maturity = new Date(r.maturity * 1000);
  const matured = maturity.getTime() <= now.getTime();
  const active = r.state === "Issued";
  let note: string;
  if (r.state === "Claimed") note = "Paid out";
  else if (matured) note = "Matured: ready to claim";
  else if (r.pendingTransfer) note = "Transfer proposal open";
  else note = `Matures ${maturity.toISOString().slice(0, 10)}`;
  return {
    id: r.rightId, amount: formatBaseUnits(r.amount, decimals), ownedByMe, maturity, matured, state: r.state,
    // Contract timing rule (ABI v2): only unmatured rights can change hands.
    canProposeTransfer: ownedByMe && active && !matured && !r.pendingTransfer,
    canClaim: ownedByMe && active && matured, note,
  };
}

/** Longest offer the contract will accept: at most 30 days and never past the right's maturity. */
export function maxOfferHours(r: Pick<Right, "maturity">, now: Date): number {
  return Math.max(0, Math.min(720, Math.floor((r.maturity * 1000 - now.getTime()) / 3600_000)));
}

export interface GovernanceView { tone: Tone; title: string; body: string }

/**
 * Upgrade disclosure. The contract announces every upgrade on-chain a week before it can take
 * effect; members should see it while they can still claim matured rights or leave.
 */
export function governanceView(c: ContractInfo, now: Date): GovernanceView | null {
  if (c.pendingUpgrade) {
    const at = new Date(c.pendingUpgrade.executableAfter * 1000);
    const ready = at.getTime() <= now.getTime();
    return {
      tone: "warn",
      title: ready ? "A contract upgrade can now be installed" : "A contract upgrade has been announced",
      body: ready
        ? `New code ${c.pendingUpgrade.wasmHash.slice(0, 12)}… was announced on-chain and its 7-day notice has passed: the admin may install it at any time. Escrowed funds and rights carry over.`
        : `New code ${c.pendingUpgrade.wasmHash.slice(0, 12)}… was proposed on-chain and cannot take effect before ${at.toISOString().slice(0, 16).replace("T", " ")} UTC. Escrowed funds and rights carry over; review the change before then.`,
    };
  }
  if (c.upgradesLocked) return { tone: "good", title: "Contract code is locked", body: "The escrow contract can never be upgraded again." };
  return null;
}

export function describeDescriptor(i: Pick<Intent, "descriptor">, decimals = 7): string {
  const d = i.descriptor;
  const args = d.args.map((a) => `${a.name} = ${a.type === "i128" ? `${formatBaseUnits(a.value, decimals)} (${a.value} base units)` : a.value}`);
  return `${d.function}(${args.join(", ")}) on ${d.contractId}`;
}
