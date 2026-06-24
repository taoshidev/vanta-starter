import { Badge, type BadgeProps } from "@/components/ui/badge";

/** Map a backend status string to a sensible badge tone + readable label. */
const TONE: Record<string, BadgeProps["variant"]> = {
  verified: "success",
  active: "success",
  completed: "success",
  paid: "success",
  succeeded: "success",
  processing: "warning",
  pending: "warning",
  needs_input: "warning",
  requested: "warning",
  unverified: "secondary",
  inactive: "secondary",
  failed: "destructive",
  rejected: "destructive",
  canceled: "destructive",
  cancelled: "destructive",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status ?? "unknown").toLowerCase();
  const variant = TONE[s] ?? "outline";
  const label = s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <Badge variant={variant}>{label}</Badge>;
}
