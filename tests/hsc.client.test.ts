/**
 * Unit tests for the BFF HTTP client (lib/hsc/client.ts).
 *
 * fetch is stubbed so we don't need a real API or cookie store.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Avoid the actual `next/headers` import — we don't need cookies here.
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

vi.mock("server-only", () => ({}));

import { _resetTokenCacheForTests } from "@/lib/hsc/oauth";

const originalFetch = globalThis.fetch;

beforeEach(() => _resetTokenCacheForTests());
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function mockResponses(responses: Array<{ status?: number; json: unknown }>) {
  const calls: Request[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input as RequestInfo | URL, init);
    calls.push(req);
    const r = responses.shift()!;
    return new Response(JSON.stringify(r.json), {
      status: r.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return calls;
}

describe("hsc client", () => {
  it("fetches a token then calls /v2/auth/me with bearer", async () => {
    const calls = mockResponses([
      { json: { access_token: "tok-1", token_type: "Bearer", expires_in: 3600, scope: "api" } },
      { json: { user_id: "u1", email: "x@y.com", app_id: "a1" } },
    ]);
    const { auth } = await import("@/lib/hsc/client");
    const me = await auth.me();
    expect(me.user_id).toBe("u1");
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toContain("/v2/oauth/token");
    expect(calls[1].headers.get("authorization")).toBe("Bearer tok-1");
  });

  it("throws HscApiError with detail.code on 4xx", async () => {
    mockResponses([
      { json: { access_token: "tok", token_type: "Bearer", expires_in: 3600, scope: "api" } },
      {
        status: 401,
        json: { detail: { code: "V2_BAD", message: "nope", retryable: false } },
      },
    ]);
    const { HscApiError, auth } = await import("@/lib/hsc/client");
    await expect(auth.me()).rejects.toBeInstanceOf(HscApiError);
  });

  it("reuses the cached token across calls", async () => {
    const calls = mockResponses([
      { json: { access_token: "tok-1", token_type: "Bearer", expires_in: 3600, scope: "api" } },
      { json: { user_id: "u1", email: "x@y.com", app_id: "a1" } },
      { json: { user_id: "u1", email: "x@y.com", app_id: "a1" } },
    ]);
    const { auth } = await import("@/lib/hsc/client");
    await auth.me();
    await auth.me();
    // Only one token request, two business calls.
    expect(calls.filter((c) => c.url.endsWith("/v2/oauth/token"))).toHaveLength(1);
  });
});
