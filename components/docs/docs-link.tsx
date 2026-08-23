import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PORTAL_DOCS_ONLY, isPortalBlockedPath } from "@/lib/portal";

/** Standard "View docs" link placed in dashboard page headers.
 *
 * Doc pages also use it as "Open in app" / "Try it" pointing into the demo
 * surface (/dashboard, /login, ...), which does not exist on the production
 * portal — render nothing there. The hide-list is isPortalBlockedPath, the
 * same single source of truth the middleware enforces.
 */
export function DocsLink({
  href,
  label = "View docs",
}: {
  href: string;
  label?: string;
}) {
  if (PORTAL_DOCS_ONLY && isPortalBlockedPath(href)) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href}>
        <BookOpen className="size-3.5" />
        {label}
      </Link>
    </Button>
  );
}
