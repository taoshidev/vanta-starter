/**
 * Tests for the public self-service access-request action. Unlike the other
 * actions it does NOT use the OAuth client — it POSTs straight to the public
 * endpoint with `fetch`, so we stub `fetch` directly.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { requestAccessAction } from "./app-requests";

const originalFetch = globalThis.fetch;

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

function mockFetch(impl: (url: string, init: RequestInit) => Response) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return impl(String(input), init ?? {});
  }) as unknown as typeof fetch;
  return calls;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("requestAccessAction", () => {
  it("posts a trimmed JSON payload to the public endpoint and returns the id", async () => {
    const calls = mockFetch(
      () => new Response(JSON.stringify({ request_id: "req_1" }), { status: 201 }),
    );
    const r = await requestAccessAction(
      fd({
        company_name: "  Acme Markets ",
        slug: "acme",
        contact_email: " dev@acme.com ",
        contact_name: " Jane ",
        website: "https://acme.com",
        use_case: "Prop firm",
      }),
    );

    expect(r).toEqual({ ok: true, data: { requestId: "req_1" } });
    expect(calls[0].url).toContain("/v2/app-requests");
    expect(calls[0].init.method).toBe("POST");
    const payload = JSON.parse(String(calls[0].init.body));
    expect(payload).toEqual({
      company_name: "Acme Markets",
      slug: "acme",
      contact_email: "dev@acme.com",
      contact_name: "Jane",
      website: "https://acme.com",
      use_case: "Prop firm",
    });
  });

  it("nulls out empty optional fields", async () => {
    const calls = mockFetch(
      () => new Response(JSON.stringify({ request_id: "req_2" }), { status: 201 }),
    );
    await requestAccessAction(fd({ company_name: "A", slug: "a", contact_email: "a@b.com" }));
    const payload = JSON.parse(String(calls[0].init.body));
    expect(payload.contact_name).toBeNull();
    expect(payload.website).toBeNull();
    expect(payload.use_case).toBeNull();
  });

  it("surfaces a FastAPI detail-object error", async () => {
    mockFetch(
      () =>
        new Response(
          JSON.stringify({ detail: { code: "V2_APP_SLUG_EXISTS", message: "slug taken" } }),
          { status: 409 },
        ),
    );
    const r = await requestAccessAction(fd({ company_name: "A", slug: "a", contact_email: "a@b.com" }));
    expect(r).toMatchObject({ ok: false, code: "V2_APP_SLUG_EXISTS", message: "slug taken" });
  });

  it("surfaces a FastAPI validation (detail array) error", async () => {
    mockFetch(
      () =>
        new Response(
          JSON.stringify({ detail: [{ msg: "value is not a valid email address" }] }),
          { status: 422 },
        ),
    );
    const r = await requestAccessAction(fd({ company_name: "A", slug: "a", contact_email: "bad" }));
    expect(r).toMatchObject({ ok: false, code: "VALIDATION", message: /valid email/ });
  });

  it("uses a default message when the error body isn't JSON", async () => {
    mockFetch(() => new Response("gateway error", { status: 502 }));
    const r = await requestAccessAction(fd({ company_name: "A", slug: "a", contact_email: "a@b.com" }));
    expect(r).toMatchObject({ ok: false, code: "REQUEST_FAILED" });
  });

  it("maps a network failure to NETWORK", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    const r = await requestAccessAction(fd({ company_name: "A", slug: "a", contact_email: "a@b.com" }));
    expect(r).toMatchObject({ ok: false, code: "NETWORK", message: "ECONNREFUSED" });
  });
});
