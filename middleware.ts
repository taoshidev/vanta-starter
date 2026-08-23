import { NextResponse, type NextRequest } from "next/server";

import { PORTAL_DOCS_ONLY, isPortalBlockedPath } from "@/lib/portal";

/**
 * Portal mode's route gate. The demo surface (dashboard, auth pages, BFF API
 * routes) is redirected to the docs; everything the portal exists for
 * (/, /docs/*, /request-access) is untouched. This is the UI layer of a
 * two-layer defense — the deployment also carries no API credentials, so the
 * blocked flows could not function even without this gate.
 */
export function middleware(request: NextRequest) {
  if (!PORTAL_DOCS_ONLY) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (!isPortalBlockedPath(pathname)) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Not available on the developer portal. Use the sandbox." },
      { status: 404 },
    );
  }
  return NextResponse.redirect(new URL("/docs", request.url));
}

export const config = {
  // Keep the matcher broad and decide in code: the PORTAL_DOCS_ONLY check is
  // one env read, and a code-level list stays in one place (lib/portal.ts)
  // instead of drifting from this matcher.
  matcher: ["/dashboard/:path*", "/login", "/signup", "/verify-email", "/reset-password", "/api/:path*"],
};
