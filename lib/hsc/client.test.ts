/**
 * Behavioral tests for the typed BFF client (lib/hsc/client.ts), focused on the
 * shared `hsc()` request helper: session-token injection, both error-envelope
 * shapes, 204 handling, and per-call headers (X-Prop-Account). The token grant
 * is always stubbed as the first response.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieValue = vi.fn<() => string | undefined>(() => undefined);

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => {
    const value = cookieValue();
    return value ? { value } : undefined;
  } }),
}));

import { _resetTokenCacheForTests } from "./oauth";

const originalFetch = globalThis.fetch;
const TOKEN_OK = {
  access_token: "tok",
  token_type: "Bearer",
  expires_in: 3600,
  scope: "api",
};

type Resp = { status?: number; json?: unknown; text?: string };

function mockResponses(responses: Resp[]) {
  const calls: Request[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(new Request(input as RequestInfo | URL, init));
    const r = responses.shift()!;
    const status = r.status ?? 200;
    if (status === 204) return new Response(null, { status: 204 });
    const bodyText = r.text ?? JSON.stringify(r.json ?? null);
    return new Response(bodyText, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return calls;
}

beforeEach(() => {
  _resetTokenCacheForTests();
  cookieValue.mockReturnValue(undefined);
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("hsc() request helper", () => {
  it("attaches X-Session-Token from the cookie on user-authed calls", async () => {
    cookieValue.mockReturnValue("sess-abc");
    const calls = mockResponses([{ json: TOKEN_OK }, { json: { user_id: "u1" } }]);
    const { auth } = await import("./client");
    await auth.me();
    expect(calls[1].headers.get("x-session-token")).toBe("sess-abc");
  });

  it("omits X-Session-Token on public calls even when a cookie exists", async () => {
    cookieValue.mockReturnValue("sess-abc");
    const calls = mockResponses([{ json: TOKEN_OK }, { json: { app_id: "a1" } }]);
    const { apps } = await import("./client");
    await apps.me(); // authedAsUser: false
    expect(calls[1].headers.get("x-session-token")).toBeNull();
  });

  it("sends a JSON body + content-type when `json` is provided", async () => {
    const calls = mockResponses([{ json: TOKEN_OK }, { json: { sent: true } }]);
    const { auth } = await import("./client");
    await auth.signup("x@y.com", "pw");
    expect(calls[1].headers.get("content-type")).toBe("application/json");
    await expect(calls[1].json()).resolves.toEqual({ email: "x@y.com", password: "pw" });
  });

  it("parses the FastAPI `detail` error envelope", async () => {
    mockResponses([
      { json: TOKEN_OK },
      { status: 409, json: { detail: { code: "V2_EMAIL_TAKEN", message: "taken", retryable: false } } },
    ]);
    const { auth, HscApiError } = await import("./client");
    await expect(auth.me()).rejects.toMatchObject({ code: "V2_EMAIL_TAKEN", status: 409 });
    expect(new HscApiError(1, "x", "y")).toBeInstanceOf(Error);
  });

  it("parses the platform `error` envelope and retryable flag", async () => {
    mockResponses([
      { json: TOKEN_OK },
      { status: 502, json: { error: { code: "V2_UPSTREAM", message: "down", retryable: true } } },
    ]);
    const { auth } = await import("./client");
    await expect(auth.me()).rejects.toMatchObject({
      code: "V2_UPSTREAM",
      status: 502,
      retryable: true,
    });
  });

  it("falls back to UNKNOWN + status text when the error body has no envelope", async () => {
    mockResponses([{ json: TOKEN_OK }, { status: 500, text: "" }]);
    const { auth } = await import("./client");
    await expect(auth.me()).rejects.toMatchObject({ code: "UNKNOWN", status: 500 });
  });

  it("returns undefined for a 204 No Content (e.g. DELETE)", async () => {
    mockResponses([{ json: TOKEN_OK }, { status: 204 }]);
    const { apiKeys } = await import("./client");
    await expect(apiKeys.revoke("k1")).resolves.toBeUndefined();
  });

  it("adds the X-Prop-Account header when a prop account id is passed", async () => {
    const calls = mockResponses([{ json: TOKEN_OK }, { json: [] }]);
    const { trading } = await import("./client");
    await trading.positions("prop-1");
    expect(calls[1].headers.get("x-prop-account")).toBe("prop-1");
  });

  it("omits X-Prop-Account when no id is passed", async () => {
    const calls = mockResponses([{ json: TOKEN_OK }, { json: [] }]);
    const { trading } = await import("./client");
    await trading.positions();
    expect(calls[1].headers.get("x-prop-account")).toBeNull();
  });

  it("url-encodes the trade_pair in cancel()", async () => {
    const calls = mockResponses([{ json: TOKEN_OK }, { json: { success: true } }]);
    const { trading } = await import("./client");
    await trading.cancel("ord-1", "BTC/USD");
    expect(calls[1].url).toContain("/v2/trading/orders/ord-1?trade_pair=BTC%2FUSD");
    expect(calls[1].method).toBe("DELETE");
  });
});
