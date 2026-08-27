/**
 * Thin typed wrapper around hyperscaled-api's REST surface.
 *
 * The single ``hsc(path, init)`` helper handles:
 *   1. Bearer OAuth (client-credentials, cached).
 *   2. Optional end-user ``X-Session-Token`` from the request's cookie.
 *   3. JSON encode/decode + structured error throwing.
 *
 * Domain functions below wrap each endpoint as a typed call.
 */
import "server-only";

import { cookies } from "next/headers";

import { PORTAL_DOCS_ONLY } from "@/lib/portal";

import { hscConfig } from "./config";
import { getAppAccessToken } from "./oauth";

export class HscApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable = false,
  ) {
    super(message);
    this.name = "HscApiError";
  }
}

type Init = RequestInit & {
  json?: unknown;
  authedAsUser?: boolean;
  sessionTokenOverride?: string;
};

async function hsc<T = unknown>(path: string, init: Init = {}): Promise<T> {
  if (PORTAL_DOCS_ONLY) {
    // Server-side belt to the middleware's braces: the portal deployment has
    // no credentials, so no authed call can succeed — fail it deliberately
    // with a clear message instead of a confusing OAuth error.
    throw new HscApiError(
      404,
      "PORTAL_MODE",
      "Not available on the developer portal. Use the sandbox to try live flows.",
    );
  }
  const token = await getAppAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (init.authedAsUser !== false) {
    const session =
      init.sessionTokenOverride ?? (await cookies()).get(hscConfig.sessionCookieName)?.value;
    if (session) headers.set("X-Session-Token", session);
  }

  const resp = await fetch(`${hscConfig.baseUrl}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    cache: "no-store",
  });
  if (resp.status === 204) return undefined as T;
  const text = await resp.text();
  const parsed = text ? safeJson(text) : null;
  if (!resp.ok) {
    // The API surfaces errors in two shapes: FastAPI's `{ detail: {...} }` and
    // the platform envelope `{ error: {...} }`. Prefer either's structured
    // fields; only fall back to the status text so we never leak a raw JSON
    // blob into the UI.
    const env = parsed as {
      detail?: { code?: string; message?: string; retryable?: boolean };
      error?: { code?: string; message?: string; retryable?: boolean };
    };
    const d = env?.detail ?? env?.error;
    throw new HscApiError(
      resp.status,
      d?.code ?? "UNKNOWN",
      d?.message ?? (typeof parsed === "string" ? parsed : resp.statusText),
      Boolean(d?.retryable),
    );
  }
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ── domain calls ────────────────────────────────────────────────────────

export const auth = {
  signup: (email: string, password: string) =>
    hsc<{ user_id: string; email: string; email_verified: boolean; otp_sent: boolean }>(
      "/v2/auth/signup",
      { method: "POST", json: { email, password }, authedAsUser: false },
    ),
  verifyEmail: (email: string, code: string) =>
    hsc<{
      user_id: string;
      email: string;
      email_verified: boolean;
      session_token?: string;
      session_expires_at?: string;
    }>("/v2/auth/verify-email", {
      method: "POST",
      json: { email, code },
      authedAsUser: false,
    }),
  resendOtp: (email: string) =>
    hsc<{ sent: boolean }>("/v2/auth/resend-otp", {
      method: "POST",
      json: { email },
      authedAsUser: false,
    }),
  // When the user has TOTP enabled and no `totp_code` is supplied, the API
  // responds with `{ mfa_required: true }` and no session token — the caller
  // must re-submit with the second factor. The session/user fields are only
  // populated once authentication is fully complete.
  login: (email: string, password: string, totp_code?: string) =>
    hsc<{
      user_id?: string;
      email?: string;
      session_token?: string;
      session_expires_at?: string;
      mfa_required: boolean;
    }>("/v2/auth/login", {
      method: "POST",
      json: { email, password, totp_code },
      authedAsUser: false,
    }),
  logout: (session_token: string) =>
    hsc<{ revoked: boolean }>("/v2/auth/sessions/revoke", {
      method: "POST",
      json: { session_token },
      authedAsUser: false,
    }),
  me: () => hsc<{ user_id: string; email: string; app_id: string }>("/v2/auth/me"),
  requestReset: (email: string) =>
    hsc<{ sent: boolean }>("/v2/auth/password-reset/request", {
      method: "POST",
      json: { email },
      authedAsUser: false,
    }),
  confirmReset: (email: string, token: string, new_password: string) =>
    hsc<{ reset: boolean }>("/v2/auth/password-reset/confirm", {
      method: "POST",
      json: { email, token, new_password },
      authedAsUser: false,
    }),
};

export const oauth = {
  me: () =>
    hsc<{ app_id: string; slug: string; entity_hotkey: string | null; scopes: string[] }>(
      "/v2/oauth/me",
      { authedAsUser: false },
    ),
};

export const apps = {
  me: () =>
    hsc<{
      app_id: string;
      slug: string;
      name: string;
      entity_hotkey: string | null;
      allowed_scopes: string[];
      active: boolean;
    }>("/v2/apps/me", { authedAsUser: false }),
};

export const kyc = {
  status: () =>
    hsc<{
      user_id: string;
      kyc_provider: string | null;
      kyc_status: "unverified" | "processing" | "needs_input" | "verified" | "failed";
      kyc_verified_at: string | null;
      kyc_failure_reason: string | null;
    }>("/v2/kyc/status"),
  sumsubToken: () =>
    hsc<{ token: string; user_id: string; level_name: string; applicant_id: string | null }>(
      "/v2/kyc/sumsub/token",
      { method: "POST" },
    ),
};

export const payments = {
  checkout: (body: {
    tier_id: string;
    market: string;
    asset_class: string;
    account_size: number;
    amount_cents: number;
    currency?: string;
  }) =>
    hsc<{
      payment_id: string;
      stripe_payment_intent_id: string;
      client_secret: string;
      amount_cents: number;
      currency: string;
      status: string;
    }>("/v2/payments/checkout", { method: "POST", json: body }),
  freeAccount: (body: { tier_id: string; asset_class: string; account_size: number }) =>
    hsc<PropAccountSummary>("/v2/payments/free", { method: "POST", json: body }),
  listPropAccounts: () =>
    hsc<PropAccountSummary[]>("/v2/payments/prop-accounts"),
  getPropAccount: (id: string) =>
    hsc<PropAccountSummary>(`/v2/payments/prop-accounts/${id}`),
};

export type PropAccountSummary = {
  id: string;
  tier_id: string;
  asset_class: string;
  account_size: number;
  status: string;
  subaccount_id: number | null;
  subaccount_uuid: string | null;
  synthetic_hotkey: string | null;
  stripe_payment_intent_id: string | null;
};

export const connect = {
  createAccount: (country = "US") =>
    hsc<{
      id: string;
      stripe_account_id: string;
      onboarding_url: string;
      status: string;
      payouts_enabled: boolean;
      charges_enabled: boolean;
      details_submitted: boolean;
    }>("/v2/connect/accounts", { method: "POST", json: { country } }),
  list: () =>
    hsc<Array<{
      id: string;
      stripe_account_id: string;
      status: string | null;
      payouts_enabled: boolean;
      charges_enabled: boolean;
      details_submitted: boolean;
      bank_name: string | null;
      last4: string | null;
      country: string | null;
    }>>("/v2/connect/accounts"),
  refreshLink: (stripeAccountId: string) =>
    hsc<{ onboarding_url: string }>(
      `/v2/connect/accounts/${stripeAccountId}/onboarding-link`,
      { method: "POST" },
    ),
};

/**
 * Payouts are READ-ONLY for partner apps.
 *
 * Initiation (`POST /v2/payouts/request` and `POST /v2/payouts/{id}/submit`)
 * requires the `payouts:write` scope, which the platform deliberately excludes
 * from the `api` superscope — a partner tenant cannot be granted it, and calls
 * return 403 `V2_SCOPE_MISSING`. Disbursement is an operator-driven step run by
 * the platform, not by your app. Show your users what they have earned with
 * `estimate()` and what has been paid with `list()`.
 */
export const payouts = {
  list: () => hsc<PayoutResponse[]>("/v2/payouts"),
  estimate: (propAccountId?: string) =>
    hsc<PayoutEstimate>("/v2/payouts/estimate", {
      headers: propAccountIdHeader(propAccountId),
    }),
};

export type PayoutEstimate = {
  amount_usd: number;
  amount_cents: number;
  currency: string;
  available: boolean;
};

export type PayoutResponse = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  stripe_transfer_id: string | null;
  failure_reason: string | null;
  requested_at: string | null;
  completed_at: string | null;
};

export const agreements = {
  sign: (body: { agreement_version: string; signature_name: string }) =>
    hsc<{ signed: boolean; signed_at: string; agreement_version: string }>(
      "/v2/agreements/sign",
      { method: "POST", json: body },
    ),
  status: () =>
    hsc<{ signed: boolean; signed_at: string | null; agreement_version: string | null }>(
      "/v2/agreements/status",
    ),
  audits: () =>
    hsc<
      Array<{
        id: string;
        agreement_version: string;
        signature_name: string;
        signed_at: string;
        document_url: string | null;
      }>
    >("/v2/agreements/audits"),
};

export const apiKeys = {
  create: (body: { label: string; prop_account_id?: string }) =>
    hsc<{
      id: string;
      label: string;
      key_id: string;
      key_secret: string;
      prop_account_id: string | null;
    }>("/v2/api-keys", { method: "POST", json: body }),
  list: () => hsc<Array<{ id: string; label: string; key_id: string; revoked_at: string | null }>>(
    "/v2/api-keys",
  ),
  revoke: (id: string) =>
    hsc<{ revoked: boolean }>(`/v2/api-keys/${id}`, { method: "DELETE" }),
};

export const trading = {
  submit: (body: Record<string, unknown>, propAccountId?: string) =>
    hsc<TradingResult>("/v2/trading/orders", {
      method: "POST",
      json: body,
      headers: propAccountIdHeader(propAccountId),
    }),
  close: (trade_pair: string, propAccountId?: string) =>
    hsc<TradingResult>("/v2/trading/orders/close", {
      method: "POST",
      json: { trade_pair },
      headers: propAccountIdHeader(propAccountId),
    }),
  bulkClose: (position_uuids: string[], propAccountId?: string) =>
    hsc<TradingResult>("/v2/trading/orders/bulk-close", {
      method: "POST",
      json: { position_uuids },
      headers: propAccountIdHeader(propAccountId),
    }),
  cancel: (order_uuid: string, trade_pair: string, propAccountId?: string) =>
    hsc<TradingResult>(
      `/v2/trading/orders/${order_uuid}?trade_pair=${encodeURIComponent(trade_pair)}`,
      { method: "DELETE", headers: propAccountIdHeader(propAccountId) },
    ),
  edit: (order_uuid: string, body: Record<string, unknown>, propAccountId?: string) =>
    hsc<TradingResult>(`/v2/trading/orders/${order_uuid}/edit`, {
      method: "POST",
      json: body,
      headers: propAccountIdHeader(propAccountId),
    }),
  tpSl: (body: Record<string, unknown>, propAccountId?: string) =>
    hsc<TradingResult>("/v2/trading/orders/tp-sl", {
      method: "POST",
      json: body,
      headers: propAccountIdHeader(propAccountId),
    }),
  positions: (propAccountId?: string) =>
    hsc<Array<Record<string, unknown>>>("/v2/trading/positions", {
      headers: propAccountIdHeader(propAccountId),
    }),
  orders: (propAccountId?: string) =>
    hsc<Array<Record<string, unknown>>>("/v2/trading/orders", {
      headers: propAccountIdHeader(propAccountId),
    }),
  history: (propAccountId?: string) =>
    hsc<Array<Record<string, unknown>>>("/v2/trading/history", {
      headers: propAccountIdHeader(propAccountId),
    }),
  balance: (propAccountId?: string) =>
    hsc<{ account_size: number; status: string; subaccount_info?: Record<string, unknown> }>(
      "/v2/trading/balance",
      { headers: propAccountIdHeader(propAccountId) },
    ),
  deskPoll: (propAccountId?: string) =>
    hsc<{
      positions: Array<Record<string, unknown>>;
      orders: Array<Record<string, unknown>>;
      history: Array<Record<string, unknown>>;
      balance: { account_size: number; status: string };
    }>("/v2/trading/desk-poll", { headers: propAccountIdHeader(propAccountId) }),
};

type TradingResult = {
  success: boolean;
  order_uuid: string | null;
  message: string | null;
  processing_time: number | null;
};

function propAccountIdHeader(id?: string): Record<string, string> {
  return id ? { "X-Prop-Account": id } : {};
}

export const webhooks = {
  register: (body: { url: string; events: string[]; description?: string }) =>
    hsc<{
      id: string;
      url: string;
      events: string[];
      active: boolean;
      description: string | null;
      secret: string | null;
    }>("/v2/webhook-endpoints", { method: "POST", json: body }),
  list: () =>
    hsc<
      Array<{
        id: string;
        url: string;
        events: string[];
        active: boolean;
        description: string | null;
      }>
    >("/v2/webhook-endpoints"),
  remove: (id: string) =>
    hsc<{ deactivated: boolean }>(`/v2/webhook-endpoints/${id}`, { method: "DELETE" }),
};
