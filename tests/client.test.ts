import { describe, expect, it } from "vitest";
import { ApiClient, ApiError } from "@/lib/api/client";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const mk = (handler: (url: string, init: RequestInit) => Response | Promise<Response>, token: string | null = "tok-0123456789abcdef") => {
  const calls: { url: string; init: RequestInit }[] = [];
  const c = new ApiClient({
    baseUrl: "http://api.test", getToken: () => token, newKey: () => "key-fixed-0001",
    fetchImpl: async (url, init) => { calls.push({ url, init: init ?? {} }); return handler(url, init ?? {}); },
  });
  return { c, calls };
};
const intent = {
  id: "int_1", schemaVersion: 1, requestId: "r", kind: "FUNDING", circleId: "cir_1", state: "AWAITING_SIGNATURE",
  descriptor: { contractId: "C", function: "deposit", args: [] }, txHash: null, failureReason: null, verifiedAtLedger: 1,
  expiresAt: "x", createdAt: "x", updatedAt: "x",
};

describe("ApiClient", () => {
  it("sends bearer auth and an idempotency key on intent-creating calls", async () => {
    const { c, calls } = mk(() => json(201, intent));
    await c.fundingIntent("cir_1", "100");
    const h = calls[0]!.init.headers as Record<string, string>;
    expect(h["authorization"]).toBe("Bearer tok-0123456789abcdef");
    expect(h["idempotency-key"]).toBe("key-fixed-0001");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ amount: "100" });
  });
  it("retry with the same key is possible for the caller (key can be supplied)", async () => {
    const { c, calls } = mk(() => json(201, intent));
    await c.fundingIntent("cir_1", "100", "my-retry-key-1");
    expect((calls[0]!.init.headers as Record<string, string>)["idempotency-key"]).toBe("my-retry-key-1");
  });
  it("refuses to call without a token", async () => {
    const { c, calls } = mk(() => json(200, {}), null);
    await expect(c.listCircles()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(calls).toHaveLength(0);
  });
  it("maps API errors to ApiError with request id; 503 and network errors are retryable, 4xx not", async () => {
    const err = (status: number, code: string) => mk(() => json(status, { error: { code, message: "m", requestId: "req_1" } })).c.listCircles();
    await expect(err(503, "INDEXER_HALTED")).rejects.toMatchObject({ status: 503, code: "INDEXER_HALTED", requestId: "req_1", retryable: true });
    await expect(err(403, "FORBIDDEN")).rejects.toMatchObject({ retryable: false });
    const net = mk(() => { throw new TypeError("fetch failed"); }).c;
    await expect(net.listCircles()).rejects.toMatchObject({ code: "NETWORK", retryable: true });
    expect(ApiError).toBeTruthy();
  });
  it("fails closed when the response shape is unexpected", async () => {
    const { c } = mk(() => json(200, { circles: [{ id: 1 }] }));
    await expect(c.listCircles()).rejects.toMatchObject({ code: "SCHEMA_MISMATCH" });
    const garbage = mk(() => new Response("<html>", { status: 200 })).c;
    await expect(garbage.listCircles()).rejects.toMatchObject({ code: "SCHEMA_MISMATCH" });
  });
  it("encodes path ids", async () => {
    const { c, calls } = mk(() => json(200, { circleId: "x", bound: false }));
    await c.coverage("a/b?c");
    expect(calls[0]!.url).toBe("http://api.test/v1/circles/a%2Fb%3Fc/coverage");
  });
});
