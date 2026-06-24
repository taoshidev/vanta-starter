/**
 * Human-readable copy for known API error codes. Keeps the UI from ever
 * showing a raw JSON blob or an opaque code to an end user. Unknown codes fall
 * back to the server message (already cleaned by the hsc client) or a generic
 * line.
 */
const FRIENDLY: Record<string, string> = {
  UNKNOWN: "Something went wrong. Please try again.",
  HS_INTERNAL_ERROR: "Our server hit an unexpected error. Please try again in a moment.",
  V2_INVALID_CREDENTIALS: "That email or password doesn't match our records.",
  V2_EMAIL_NOT_VERIFIED: "Please verify your email before signing in.",
  V2_OTP_INVALID: "That code is incorrect or has expired. Request a new one.",
  V2_OTP_EXPIRED: "That code has expired. Request a new one.",
  V2_EMAIL_TAKEN: "An account with this email already exists. Try signing in.",
  V2_RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  V2_KYC_NOT_CONFIGURED: "Identity verification isn't available right now.",
  V2_SUMSUB_NOT_CONFIGURED: "Identity verification isn't configured for this app yet.",
  V2_SUMSUB_HTTP: "Identity verification provider is temporarily unavailable.",
  V2_PAYMENTS_NOT_CONFIGURED: "Payments aren't configured for this app yet.",
};

export function friendlyError(code: string | undefined, fallback?: string): string {
  if (code && FRIENDLY[code]) return FRIENDLY[code];
  if (fallback && fallback.trim() && !fallback.trim().startsWith("{")) return fallback;
  return FRIENDLY.UNKNOWN;
}
