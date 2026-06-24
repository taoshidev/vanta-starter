import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="animate-fade-in">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
