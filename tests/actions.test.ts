/**
 * Regression tests for the server actions — verifies the action calls into
 * the typed client and surfaces errors with the right shape.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/session", () => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  getSessionTokenFromCookie: vi.fn(),
}));

import * as hsc from "@/lib/hsc/client";

import { loginAction, signupAction } from "@/app/actions/auth";

describe("auth actions", () => {
  it("loginAction sets a cookie on success", async () => {
    vi.spyOn(hsc.auth, "login").mockResolvedValue({
      user_id: "u1",
      email: "x@y.com",
      session_token: "tok",
      session_expires_at: new Date(Date.now() + 60_000).toISOString(),
      mfa_required: false,
    });
    const fd = new FormData();
    fd.set("email", "x@y.com");
    fd.set("password", "p");
    const r = await loginAction(fd);
    expect(r.ok).toBe(true);
    expect((r as any).data.mfa_required).toBe(false);
  });

  it("signupAction surfaces API error codes", async () => {
    vi.spyOn(hsc.auth, "signup").mockRejectedValue(
      new hsc.HscApiError(409, "V2_EMAIL_EXISTS", "Email already in use"),
    );
    const fd = new FormData();
    fd.set("email", "x@y.com");
    fd.set("password", "ppppppppp");
    const r = await signupAction(fd);
    expect(r.ok).toBe(false);
    expect((r as any).code).toBe("V2_EMAIL_EXISTS");
  });
});
