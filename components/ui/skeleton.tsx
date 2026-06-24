import { cn } from "@/lib/utils";

/** Loading placeholder with a subtle shimmer sweep. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer rounded-md bg-muted/60", className)} {...props} />;
}

export { Skeleton };
