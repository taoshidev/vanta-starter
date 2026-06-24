/**
 * Server-action tests for the auth flow. The typed client and the cookie/session
 * helpers are mocked so we assert the action's orchestration + error mapping
 * rather than network behavior.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));
const { setSessionCookie, clearSessionCookie } = vi.hoisted(() => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));
const cookieGet = vi.hoisted(() => vi.fn(() => ({ value: "sess-1" })));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));
vi.mock("@/lib/session", () => ({ setSessionCookie, clearSessionCookie }));

import * as hsc from "@/lib/hsc/client";

import {
  confirmPasswordResetAction,
  loginAction,
  logoutAction,
  requestPasswordResetAction,
  resendOtpAction,
  signupAction,
  verifyEmailAction,
} from "./auth";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("signupAction", () => {
  it("returns the email on success", async () => {
    vi.spyOn(hsc.auth, "signup").mockResolvedValue({
      user_id: "u1",
      email: "x@y.com",
      email_verified: false,
      otp_sent: true,
    });
    const r = await signupAction(fd({ email: "x@y.com", password: "ppppppppp" }));
    expect(r).toEqual({ ok: true, data: { email: "x@y.com" } });
  });

  it("maps an HscApiError to its code", async () => {
    vi.spyOn(hsc.auth, "signup").mockRejectedValue(
      new hsc.HscApiError(409, "V2_EMAIL_TAKEN", "taken"),
    );
    const r = await signupAction(fd({ email: "x@y.com", password: "p" }));
    expect(r).toMatchObject({ ok: false, code: "V2_EMAIL_TAKEN" });
  });

  it("maps a non-API error to UNKNOWN", async () => {
    vi.spyOn(hsc.auth, "signup").mockRejectedValue(new Error("boom"));
    const r = await signupAction(fd({ email: "x@y.com", password: "p" }));
    expect(r).toMatchObject({ ok: false, code: "UNKNOWN", message: "boom" });
  });
});

describe("verifyEmailAction", () => {
  it("sets a session cookie when the API returns a session token", async () => {
    vi.spyOn(hsc.auth, "verifyEmail").mockResolvedValue({
      user_id: "u1",
      email: "x@y.com",
      email_verified: true,
      session_token: "tok",
      session_expires_at: "2099-01-01T00:00:00Z",
    });
    const r = await verifyEmailAction(fd({ email: "x@y.com", code: "123456" }));
    expect(r).toEqual({ ok: true, data: { session: true } });
    expect(setSessionCookie).toHaveBeenCalledWith("tok", "2099-01-01T00:00:00Z");
  });

  it("reports no session when the API verifies without a token", async () => {
    vi.spyOn(hsc.auth, "verifyEmail").mockResolvedValue({
      user_id: "u1",
      email: "x@y.com",
      email_verified: true,
    });
    const r = await verifyEmailAction(fd({ email: "x@y.com", code: "123456" }));
    expect(r).toEqual({ ok: true, data: { session: false } });
    expect(setSessionCookie).not.toHaveBeenCalled();
  });
});

describe("loginAction", () => {
  it("sets the cookie and surfaces mfa_required", async () => {
    vi.spyOn(hsc.auth, "login").mockResolvedValue({
      user_id: "u1",
      email: "x@y.com",
      session_token: "tok",
      session_expires_at: "2099-01-01T00:00:00Z",
      mfa_required: true,
    });
    const r = await loginAction(fd({ email: "x@y.com", password: "p" }));
    expect(r).toEqual({ ok: true, data: { mfa_required: true } });
    expect(setSessionCookie).toHaveBeenCalledWith("tok", "2099-01-01T00:00:00Z");
  });

  it("passes the TOTP code through when present", async () => {
    const spy = vi.spyOn(hsc.auth, "login").mockResolvedValue({
      user_id: "u1",
      email: "x@y.com",
      session_token: "tok",
      session_expires_at: "2099-01-01T00:00:00Z",
      mfa_required: false,
    });
    await loginAction(fd({ email: "x@y.com", password: "p", totp_code: "654321" }));
    expect(spy).toHaveBeenCalledWith("x@y.com", "p", "654321");
  });

  it("maps invalid credentials to the API code", async () => {
    vi.spyOn(hsc.auth, "login").mockRejectedValue(
      new hsc.HscApiError(401, "V2_INVALID_CREDENTIALS", "nope"),
    );
    const r = await loginAction(fd({ email: "x@y.com", password: "bad" }));
    expect(r).toMatchObject({ ok: false, code: "V2_INVALID_CREDENTIALS" });
  });
});

describe("logoutAction", () => {
  it("revokes the session, clears the cookie, and redirects to /login", async () => {
    const revoke = vi.spyOn(hsc.auth, "logout").mockResolvedValue({ revoked: true });
    await logoutAction();
    expect(revoke).toHaveBeenCalledWith("sess-1");
    expect(clearSessionCookie).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("still clears + redirects when revoke throws", async () => {
    vi.spyOn(hsc.auth, "logout").mockRejectedValue(new Error("down"));
    await logoutAction();
    expect(clearSessionCookie).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});

describe("password reset + resend OTP", () => {
  it("resendOtpAction returns ok on success", async () => {
    vi.spyOn(hsc.auth, "resendOtp").mockResolvedValue({ sent: true });
    await expect(resendOtpAction("x@y.com")).resolves.toEqual({ ok: true });
  });

  it("requestPasswordResetAction maps errors", async () => {
    vi.spyOn(hsc.auth, "requestReset").mockRejectedValue(
      new hsc.HscApiError(429, "V2_RATE_LIMITED", "slow down"),
    );
    await expect(requestPasswordResetAction("x@y.com")).resolves.toMatchObject({
      ok: false,
      code: "V2_RATE_LIMITED",
    });
  });

  it("confirmPasswordResetAction forwards the token + new password", async () => {
    const spy = vi.spyOn(hsc.auth, "confirmReset").mockResolvedValue({ reset: true });
    const r = await confirmPasswordResetAction(
      fd({ email: "x@y.com", token: "t", new_password: "newpw" }),
    );
    expect(r).toEqual({ ok: true });
    expect(spy).toHaveBeenCalledWith("x@y.com", "t", "newpw");
  });
});
