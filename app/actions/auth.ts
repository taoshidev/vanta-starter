"use server";

import { redirect } from "next/navigation";

import * as hsc from "@/lib/hsc/client";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; code: string; message: string };

function failure<T = undefined>(e: unknown): ActionResult<T> {
  if (e instanceof hsc.HscApiError) return { ok: false, code: e.code, message: e.message };
  return { ok: false, code: "UNKNOWN", message: e instanceof Error ? e.message : "Unknown error" };
}

export async function signupAction(formData: FormData): Promise<ActionResult<{ email: string }>> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await hsc.auth.signup(email, password);
    return { ok: true, data: { email } };
  } catch (e) {
    return failure<{ email: string }>(e);
  }
}

export async function verifyEmailAction(
  formData: FormData,
): Promise<ActionResult<{ session: boolean }>> {
  const email = String(formData.get("email") ?? "");
  const code = String(formData.get("code") ?? "");
  try {
    const r = await hsc.auth.verifyEmail(email, code);
    if (r.session_token) {
      await setSessionCookie(r.session_token, r.session_expires_at ?? null);
      return { ok: true, data: { session: true } };
    }
    return { ok: true, data: { session: false } };
  } catch (e) {
    return failure<{ session: boolean }>(e);
  }
}

export async function resendOtpAction(email: string): Promise<ActionResult> {
  try {
    await hsc.auth.resendOtp(email);
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function loginAction(
  formData: FormData,
): Promise<ActionResult<{ mfa_required: boolean }>> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const totp_code = formData.get("totp_code") ? String(formData.get("totp_code")) : undefined;
  try {
    const r = await hsc.auth.login(email, password, totp_code);
    // The API now refuses to issue a session token until the second factor
    // is supplied — so MFA-pending responses arrive without a token. Only
    // set the cookie when the API actually issued one.
    if (r.session_token) {
      await setSessionCookie(r.session_token, r.session_expires_at ?? null);
    }
    return { ok: true, data: { mfa_required: Boolean(r.mfa_required) } };
  } catch (e) {
    return failure<{ mfa_required: boolean }>(e);
  }
}

export async function logoutAction(): Promise<void> {
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const session = jar.get(process.env.SESSION_COOKIE_NAME ?? "hsc_starter_session")?.value;
    if (session) {
      await hsc.auth.logout(session);
    }
  } catch {
    // ignore
  }
  await clearSessionCookie();
  redirect("/login");
}

export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  try {
    await hsc.auth.requestReset(email);
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function confirmPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("token") ?? "");
  const new_password = String(formData.get("new_password") ?? "");
  try {
    await hsc.auth.confirmReset(email, token, new_password);
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
