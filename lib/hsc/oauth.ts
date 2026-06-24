/**
 * OAuth2 client-credentials helper.
 *
 * Caches the access token in-process for ~90% of its TTL so we don't hit the
 * token endpoint on every request. In a multi-instance deployment, swap the
 * in-process cache for Redis.
 */
import "server-only";

import { hscConfig } from "./config";

let cached: { token: string; expiresAt: number } | null = null;

export async function getAppAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt - 30_000 > now) return cached.token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: hscConfig.clientId,
    client_secret: hscConfig.clientSecret,
    scope: hscConfig.scope,
  });
  const resp = await fetch(`${hscConfig.baseUrl}/v2/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OAuth token grant failed (${resp.status}): ${text}`);
  }
  const json = (await resp.json()) as {
    access_token: string;
    expires_in: number;
  };
  cached = {
    token: json.access_token,
    expiresAt: now + json.expires_in * 1000 * 0.9,
  };
  return json.access_token;
}

export function _resetTokenCacheForTests(): void {
  cached = null;
}
