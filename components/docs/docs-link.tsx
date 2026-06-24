import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Standard "View docs" link placed in dashboard page headers. */
export function DocsLink({
  href,
  label = "View docs",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href}>
        <BookOpen className="size-3.5" />
        {label}
      </Link>
    </Button>
  );
}
