import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { _resetTokenCacheForTests, getAppAccessToken } from "./oauth";

const originalFetch = globalThis.fetch;

function mockToken(json: unknown, status = 200) {
  globalThis.fetch = vi.fn(async () =>
    new Response(JSON.stringify(json), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

beforeEach(() => _resetTokenCacheForTests());
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("getAppAccessToken", () => {
  it("posts client credentials as form-urlencoded and returns the token", async () => {
    mockToken({ access_token: "tok-1", expires_in: 3600 });
    const token = await getAppAccessToken();

    expect(token).toBe("tok-1");
    const call = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const [url, init] = call;
    expect(String(url)).toContain("/v2/oauth/token");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    const body = String(init.body);
    expect(body).toContain("grant_type=client_credentials");
    expect(body).toContain("client_id=hsc_test");
  });

  it("caches the token across calls (single network request)", async () => {
    mockToken({ access_token: "tok-cached", expires_in: 3600 });
    await getAppAccessToken();
    await getAppAccessToken();
    expect(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1);
  });

  it("re-fetches once the cached token is within the refresh window", async () => {
    // expires_in is tiny so the 30s skew immediately invalidates the cache.
    mockToken({ access_token: "tok-short", expires_in: 1 });
    await getAppAccessToken();
    await getAppAccessToken();
    expect(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(2);
  });

  it("throws a descriptive error on a non-OK grant response", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("nope", { status: 401 }),
    ) as unknown as typeof fetch;
    await expect(getAppAccessToken()).rejects.toThrow(/OAuth token grant failed \(401\)/);
  });
});
