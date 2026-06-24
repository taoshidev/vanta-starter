/**
 * End-user session cookie management.
 *
 * The cookie value is the API-issued JWT (X-Session-Token). We set it
 * httpOnly + secure so it never leaks to client JS.
 */
import "server-only";

import { cookies } from "next/headers";

import { hscConfig } from "./hsc/config";

const ONE_DAY_SECONDS = 60 * 60 * 24;

export async function setSessionCookie(
  sessionToken: string,
  expiresAtIso: string | null,
): Promise<void> {
  const jar = await cookies();
  const expires = expiresAtIso ? new Date(expiresAtIso) : new Date(Date.now() + ONE_DAY_SECONDS * 1000);
  jar.set({
    name: hscConfig.sessionCookieName,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(hscConfig.sessionCookieName);
}

export async function getSessionTokenFromCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(hscConfig.sessionCookieName)?.value;
}
