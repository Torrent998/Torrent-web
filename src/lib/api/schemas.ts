import { z } from "zod";

/** Mirrors the shapes in torrent-api openapi.v1.json that this app consumes. Checked by tests/contract.test.ts. */
export const errorBody = z.object({ error: z.object({ code: z.string(), message: z.string(), requestId: z.string() }) });

const address = z.string();
export const circle = z.object({
  id: z.string(), name: z.string(),
  ruleSet: z.object({
    tokenContractId: z.string(), maxMembers: z.number(), rounds: z.number(), roundLengthDays: z.number(),
    contributionAmount: z.string(), transferPolicy: z.literal("MEMBERS_ONLY"),
  }),
  policyHash: z.string(), poolId: z.string().nullable(), organizerAddress: address,
  members: z.array(z.object({ address, role: z.enum(["ORGANIZER", "MEMBER"]), joinedAt: z.string() })),
  createdAt: z.string(), updatedAt: z.string(),
});
export type Circle = z.infer<typeof circle>;
export const circleList = z.object({ circles: z.array(circle) });

export const INTENT_STATES = ["DRAFT", "VERIFIED", "AWAITING_SIGNATURE", "SUBMITTED", "CONFIRMED", "FAILED", "RECONCILING"] as const;
export type IntentState = (typeof INTENT_STATES)[number];
export const intent = z.object({
  id: z.string(), schemaVersion: z.literal(1), requestId: z.string(),
  kind: z.enum(["FUNDING", "TRANSFER_PROPOSE", "TRANSFER_ACCEPT", "CLAIM"]), circleId: z.string(),
  state: z.enum(INTENT_STATES),
  descriptor: z.object({
    contractId: z.string(), function: z.string(),
    args: z.array(z.object({ name: z.string(), type: z.enum(["u64", "i128", "address", "bytes32"]), value: z.string() })),
  }),
  txHash: z.string().nullable(), failureReason: z.string().nullable(), verifiedAtLedger: z.number(),
  expiresAt: z.string(), createdAt: z.string(), updatedAt: z.string(),
});
export type Intent = z.infer<typeof intent>;
export const intentEnvelope = z.object({ intent });
export const transferWithIntent = z.object({
  transfer: z.object({
    id: z.string(), circleId: z.string(), rightId: z.string(), from: z.string(), to: z.string(), expiresAt: z.string(),
    proposeIntentId: z.string(), acceptIntentId: z.string().nullable(), chainTransferId: z.string().nullable(), createdAt: z.string(),
  }),
  intent,
});

export const coverage = z.union([
  z.object({ circleId: z.string(), bound: z.literal(false) }),
  z.object({
    circleId: z.string(), bound: z.literal(true), poolId: z.string(),
    totals: z.object({ funded: z.string(), reserved: z.string(), claimed: z.string(), withdrawn: z.string() }),
    unreserved: z.string(), fullyBacked: z.boolean(), poolStatus: z.enum(["Active", "Paused"]),
    indexerStatus: z.enum(["SYNCING", "SYNCED", "RECONCILING"]), asOfLedger: z.number(), lagLedgers: z.number(), observedAt: z.string(),
  }),
]);
export type Coverage = z.infer<typeof coverage>;

export const right = z.object({
  rightId: z.string(), poolId: z.string(), amount: z.string(), owner: z.string(), maturity: z.number(),
  state: z.enum(["Issued", "Claimed"]), pendingTransfer: z.string().nullable(),
  issuedAtLedger: z.number(), claimedAtLedger: z.number().nullable(),
});
export type Right = z.infer<typeof right>;
export const rights = z.object({
  circleId: z.string(), bound: z.boolean(), indexerStatus: z.string().optional(), asOfLedger: z.number().optional(),
  rights: z.array(right),
});
export type RightsResponse = z.infer<typeof rights>;

export const challenge = z.object({ challengeId: z.string(), message: z.string(), expiresAt: z.string() });
export const login = z.object({ token: z.string(), expiresAt: z.string(), userId: z.string(), address: z.string(), roles: z.array(z.enum(["user", "auditor"])) });
export const ok = z.object({ ok: z.literal(true) });
export const invitationCreated = z.object({
  invitation: z.object({ id: z.string(), label: z.string(), status: z.string(), expiresAt: z.string() }),
  token: z.string(),
});
export const TRANSFER_STATUSES = ["PROPOSING", "AWAITING_RECIPIENT", "ACCEPTING", "COMPLETED", "FAILED"] as const;
export const transferRecord = transferWithIntent.shape.transfer.extend({ status: z.enum(TRANSFER_STATUSES) });
export type TransferRecord = z.infer<typeof transferRecord>;
export const transferList = z.object({ transfers: z.array(transferRecord) });
export const intentList = z.object({ intents: z.array(intent) });
export const auditPage = z.object({
  nextCursor: z.string().nullable(),
  events: z.array(z.object({ id: z.string(), at: z.string(), actor: z.string(), scope: z.string(), action: z.string(), object: z.string(), requestId: z.string() })),
});
export type AuditEntry = z.infer<typeof auditPage>["events"][number];
export const ledgerEvents = z.object({
  schemaVersion: z.literal(1), network: z.string(), nextCursor: z.string().nullable(), indexerStatus: z.string(),
  events: z.array(z.object({ id: z.string(), ledger: z.number(), name: z.string(), txHash: z.string(), finality: z.enum(["SUBMITTED", "CONFIRMED"]) }).passthrough()),
});
