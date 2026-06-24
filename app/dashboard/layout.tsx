import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import * as hsc from "@/lib/hsc/client";

// Auth-gated routes must render per-request so each visit reads the live
// session cookie. Without this, Next prerenders /dashboard at build time (no
// cookie → baked redirect to /login), which permanently bounces signed-in
// users back to login in production.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let email = "";
  try {
    const me = await hsc.auth.me();
    email = me.email;
  } catch {
    redirect("/login");
  }

  return <AppShell email={email}>{children}</AppShell>;
}
