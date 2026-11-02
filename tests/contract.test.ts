import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as S from "@/lib/api/schemas";

const doc = JSON.parse(readFileSync(join(process.cwd(), "fixtures/api-openapi.v1.json"), "utf8")) as {
  openapi: string;
  paths: Record<string, Record<string, { requestBody?: unknown; responses: Record<string, { content?: { "application/json": { schema: { properties?: Record<string, unknown>; required?: string[] } } } }> }>>;
};

describe("consumer contract with torrent-api (mirrored OpenAPI 3.1)", () => {
  it("every endpoint the client calls exists with the same method", () => {
    const used: [string, string][] = [
      ["get", "/v1/circles"], ["post", "/v1/circles"], ["get", "/v1/circles/{id}"], ["get", "/v1/circles/{id}/coverage"],
      ["get", "/v1/circles/{id}/rights"], ["post", "/v1/circles/{id}/funding-intents"], ["post", "/v1/rights/{id}/transfers/intent"],
      ["post", "/v1/transfers/{id}/approve"], ["post", "/v1/rights/{id}/claim-intent"], ["get", "/v1/intents/{id}"], ["post", "/v1/intents/{id}/submit"],
    ];
    expect(doc.openapi).toBe("3.1.0");
    for (const [m, p] of used) expect(doc.paths[p]?.[m], `${m} ${p}`).toBeTruthy();
  });
  const props = (path: string, method: string, status: string) =>
    Object.keys(doc.paths[path]![method]!.responses[status]!.content!["application/json"].schema.properties ?? {}).sort();
  it("web schemas know every top-level field the API documents for intents and circles", () => {
    expect(Object.keys(S.intent.shape).sort()).toEqual(props("/v1/intents/{id}", "get", "200"));
    expect(Object.keys(S.circle.shape).sort()).toEqual(props("/v1/circles/{id}", "get", "200"));
    expect(Object.keys(S.right.shape).sort()).toEqual(
      Object.keys((doc.paths["/v1/circles/{id}/rights"]!["get"]!.responses["200"]!.content!["application/json"].schema.properties!["rights"] as { items: { properties: object } }).items.properties).sort(),
    );
  });
  it("idempotent endpoints still declare the header the client sends", () => {
    for (const p of ["/v1/circles/{id}/funding-intents", "/v1/rights/{id}/transfers/intent", "/v1/transfers/{id}/approve", "/v1/rights/{id}/claim-intent"]) {
      const params = (doc.paths[p]!["post"] as unknown as { parameters: { name: string }[] }).parameters.map((x) => x.name);
      expect(params, p).toContain("Idempotency-Key");
    }
    expect(z.object({}).safeParse({}).success).toBe(true);
  });
});
