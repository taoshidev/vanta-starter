"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="text-sm font-medium text-primary">Something went wrong</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">An unexpected error occurred</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We hit a snag rendering this page. You can retry, or head back to your dashboard.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={reset}>
          <RotateCw /> Try again
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Go to dashboard</a>
        </Button>
      </div>
    </div>
  );
}
