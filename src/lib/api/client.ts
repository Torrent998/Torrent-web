import type { z } from "zod";
import * as S from "./schemas";

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly requestId?: string) {
    super(message);
    this.name = "ApiError";
  }
  /** Retrying the same request may help (network / indexer lag), as opposed to a business rejection. */
  get retryable(): boolean { return this.status === 0 || this.status === 503 || this.status === 429; }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export interface ClientOptions { baseUrl: string; getToken: () => string | null; fetchImpl?: FetchLike; newKey?: () => string; timeoutMs?: number }

export class ApiClient {
  private readonly f: FetchLike;
  constructor(private readonly o: ClientOptions) {
    this.f = o.fetchImpl ?? ((i, init) => fetch(i, init));
  }

  private async call<T>(method: "GET" | "POST", path: string, schema: z.ZodType<T>, opts: { body?: unknown; idempotent?: boolean; key?: string; anonymous?: boolean } = {}): Promise<T> {
    const token = this.o.getToken();
    if (!token && !opts.anonymous) throw new ApiError(401, "UNAUTHENTICATED", "Sign in with your wallet first.");
    const headers: Record<string, string> = { accept: "application/json" };
    if (token && !opts.anonymous) headers["authorization"] = `Bearer ${token}`;
    if (opts.body !== undefined) headers["content-type"] = "application/json";
    if (opts.idempotent) headers["idempotency-key"] = opts.key ?? (this.o.newKey ?? defaultKey)();
    let res: Response;
    try {
      res = await this.f(this.o.baseUrl + path, {
        method, headers, ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
        signal: AbortSignal.timeout(this.o.timeoutMs ?? 10_000),
      });
    } catch {
      throw new ApiError(0, "NETWORK", "Cannot reach the API. Check your connection and retry.");
    }
    let json: unknown;
    try { json = await res.json(); } catch { json = null; }
    if (!res.ok) {
      const e = S.errorBody.safeParse(json);
      if (e.success) throw new ApiError(res.status, e.data.error.code, e.data.error.message, e.data.error.requestId);
      throw new ApiError(res.status, "HTTP_ERROR", `Unexpected response (${res.status}).`);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) throw new ApiError(502, "SCHEMA_MISMATCH", "The API response did not match the expected contract; refusing to display it.");
    return parsed.data;
  }

  authChallenge(address: string) { return this.call("POST", "/v1/auth/challenge", S.challenge, { body: { address }, anonymous: true }); }
  authLogin(challengeId: string, signature: string) { return this.call("POST", "/v1/auth/login", S.login, { body: { challengeId, signature }, anonymous: true }); }
  logout() { return this.call("POST", "/v1/auth/logout", S.ok, { body: {} }); }
  createInvitation(circleId: string, label: string, key?: string) {
    return this.call("POST", `/v1/circles/${enc(circleId)}/invitations`, S.invitationCreated, { body: { label }, idempotent: true, ...(key ? { key } : {}) });
  }
  acceptInvitation(token: string) { return this.call("POST", "/v1/invitations/accept", S.circle, { body: { token } }); }
  listTransfers(circleId: string) { return this.call("GET", `/v1/circles/${enc(circleId)}/transfers`, S.transferList); }
  listIntents(circleId: string) { return this.call("GET", `/v1/circles/${enc(circleId)}/intents`, S.intentList); }
  audit(circleId: string, cursor?: string, limit = 50) {
    const q = new URLSearchParams({ limit: String(limit), ...(cursor ? { cursor } : {}) });
    return this.call("GET", `/v1/circles/${enc(circleId)}/audit?${q}`, S.auditPage);
  }
  submitTransfer(transferId: string, signedXdr: string) {
    return this.call("POST", `/v1/transfers/${enc(transferId)}/submit`, S.intentEnvelope, { body: { signedXdr } });
  }
  ledgerEvents(cursor?: string) { return this.call("GET", `/v1/ledger/events${cursor ? `?cursor=${enc(cursor)}` : ""}`, S.ledgerEvents); }

  listCircles() { return this.call("GET", "/v1/circles", S.circleList); }
  getCircle(id: string) { return this.call("GET", `/v1/circles/${enc(id)}`, S.circle); }
  createCircle(body: { name: string; ruleSet: S.Circle["ruleSet"] }) { return this.call("POST", "/v1/circles", S.circle, { body }); }
  coverage(id: string) { return this.call("GET", `/v1/circles/${enc(id)}/coverage`, S.coverage); }
  rights(id: string) { return this.call("GET", `/v1/circles/${enc(id)}/rights`, S.rights); }
  fundingIntent(id: string, amount: string, key?: string) {
    return this.call("POST", `/v1/circles/${enc(id)}/funding-intents`, S.intent, { body: { amount }, idempotent: true, ...(key ? { key } : {}) });
  }
  transferIntent(rightId: string, toAddress: string, expiresAt: string, key?: string) {
    return this.call("POST", `/v1/rights/${enc(rightId)}/transfers/intent`, S.transferWithIntent, { body: { toAddress, expiresAt }, idempotent: true, ...(key ? { key } : {}) });
  }
  approveTransfer(transferId: string, key?: string) {
    return this.call("POST", `/v1/transfers/${enc(transferId)}/approve`, S.transferWithIntent, { idempotent: true, ...(key ? { key } : {}) });
  }
  claimIntent(rightId: string, key?: string) {
    return this.call("POST", `/v1/rights/${enc(rightId)}/claim-intent`, S.intentEnvelope, { body: {}, idempotent: true, ...(key ? { key } : {}) });
  }
  getIntent(id: string) { return this.call("GET", `/v1/intents/${enc(id)}`, S.intent); }
  submitIntent(id: string, signedXdr: string) {
    return this.call("POST", `/v1/intents/${enc(id)}/submit`, S.intentEnvelope, { body: { signedXdr } });
  }
}

const enc = encodeURIComponent;
const defaultKey = () => `web-${crypto.randomUUID()}`;
