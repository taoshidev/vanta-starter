/**
 * Single source of truth for the hyperscaled-api connection.
 *
 * Never imported on the client (the `HSC_CLIENT_SECRET` here is sensitive).
 * All network calls flow through `lib/hsc/client.ts` server-side.
 */
import "server-only";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const hscConfig = {
  baseUrl: process.env.HSC_API_BASE_URL ?? "http://localhost:8000",
  clientId: process.env.HSC_CLIENT_ID ?? "",
  clientSecret: process.env.HSC_CLIENT_SECRET ?? "",
  scope: process.env.HSC_SCOPE ?? "api",
  webhookSecret: process.env.HSC_WEBHOOK_SECRET ?? "",
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "hsc_starter_session",
  sessionCookieSecret: process.env.SESSION_COOKIE_SECRET ?? "",
};

export function assertReady(): void {
  requireEnv("HSC_CLIENT_ID");
  requireEnv("HSC_CLIENT_SECRET");
  requireEnv("SESSION_COOKIE_SECRET");
}
