/**
 * Portal-mode routing + guard behavior.
 *
 * `PORTAL_DOCS_ONLY` is read at module load, so the flag-dependent cases use
 * vi.resetModules + a stubbed env and re-import.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

import { isPortalBlockedPath } from "./portal";

describe("isPortalBlockedPath", () => {
  it.each([
    "/dashboard",
    "/dashboard/payouts",
    "/dashboard/api-keys",
    "/login",
    "/signup",
    "/verify-email",
    "/reset-password",
    "/api/api-keys",
    "/api/hsc-webhook",
  ])("blocks %s", (p) => {
    expect(isPortalBlockedPath(p)).toBe(true);
  });

  it.each(["/", "/docs", "/docs/quickstart", "/docs/api-reference", "/request-access"])(
    "allows %s",
    (p) => {
      expect(isPortalBlockedPath(p)).toBe(false);
    },
  );

  it("does not block lookalike prefixes", () => {
    // startsWith("/login") alone would also catch /login-help style paths.
    expect(isPortalBlockedPath("/loginhelp")).toBe(false);
    expect(isPortalBlockedPath("/dashboardish")).toBe(false);
  });
});

describe("portal-mode client guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("every authed BFF call fails closed with PORTAL_MODE", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_DOCS_ONLY", "true");
    vi.resetModules();
    const client = await import("./hsc/client");
    // auth.me is representative: everything routes through the same hsc() helper.
    await expect(client.auth.me()).rejects.toMatchObject({ code: "PORTAL_MODE" });
  });

  it("normal mode still reaches the network layer", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_DOCS_ONLY", "false");
    vi.resetModules();
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 500 }));
    vi.stubGlobal("fetch", fetchSpy);
    const client = await import("./hsc/client");
    await expect(client.auth.me()).rejects.toThrow();
    expect(fetchSpy).toHaveBeenCalled(); // it got past the portal guard
  });
});
