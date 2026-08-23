import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PORTAL_DOCS_ONLY } from "@/lib/portal";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-sm text-primary">404</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild className="mt-6">
        {PORTAL_DOCS_ONLY ? (
          <Link href="/docs">Back to the docs</Link>
        ) : (
          <Link href="/dashboard">Back to dashboard</Link>
        )}
      </Button>
    </div>
  );
}
