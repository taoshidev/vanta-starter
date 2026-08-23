/**
 * Portal mode: the production deployment of this app.
 *
 * The starter serves two jobs from one codebase:
 *
 *  - The SANDBOX (staging): the full interactive demo — signup, KYC, the
 *    purchase flow, webhooks, trading — wired to the staging API with test
 *    credentials.
 *  - The PORTAL (production): docs + request-access ONLY. It deliberately
 *    ships with NO HSC_CLIENT_ID / HSC_CLIENT_SECRET, so even if the UI gate
 *    were bypassed the API would never issue it a token: live signup, Sumsub
 *    KYC, Stripe checkout and webhook registration are impossible by
 *    construction, not merely hidden. `POST /v2/app-requests` is public, so
 *    requesting access needs no credential.
 *
 * `NEXT_PUBLIC_` so client components (ApiTester, banners) can read it — the
 * value is inlined at build time, which is exactly what we want: the portal
 * and the sandbox are separate builds with separate env.
 */
export const PORTAL_DOCS_ONLY = process.env.NEXT_PUBLIC_PORTAL_DOCS_ONLY === "true";

/** Where to send people who want to try the live demo. */
export const SANDBOX_URL =
  process.env.NEXT_PUBLIC_SANDBOX_URL ?? "https://starter.staging.vantanetwork.io";

/** Page routes that only exist for the interactive demo. */
export const PORTAL_BLOCKED_PAGES = [
  "/dashboard",
  "/login",
  "/signup",
  "/verify-email",
  "/reset-password",
] as const;

/** True if `pathname` must not be served in portal mode. */
export function isPortalBlockedPath(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true;
  return PORTAL_BLOCKED_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
