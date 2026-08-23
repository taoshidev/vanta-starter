"use client";

import * as React from "react";
import { Loader2, Play } from "lucide-react";

import { runDocsRequestAction, type DocsOperation } from "@/app/actions/docs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PORTAL_DOCS_ONLY, SANDBOX_URL } from "@/lib/portal";

type Result = { status: number; body: unknown } | { error: string };

export function ApiTester({
  operation,
  method = "GET",
  path,
}: {
  operation: DocsOperation;
  method?: string;
  path: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);

  async function send() {
    setLoading(true);
    setResult(null);
    const r = await runDocsRequestAction(operation);
    setResult(r.ok && r.data ? r.data : { error: r.ok ? "No response" : r.message });
    setLoading(false);
  }

  const ok =
    result && "status" in result && result.status >= 200 && result.status < 300;

  if (PORTAL_DOCS_ONLY) {
    // The portal ships without API credentials, so the live tester cannot run
    // here. Same component, sandbox link instead of a Run button.
    return (
      <div className="rounded-xl border border-border bg-card/40">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Badge variant="outline" className="font-mono text-[11px]">
            {method}
          </Badge>
          <code className="flex-1 truncate font-mono text-xs text-muted-foreground">
            {path}
          </code>
          <Button size="sm" variant="outline" asChild>
            <a href={`${SANDBOX_URL}/docs`} target="_blank" rel="noreferrer">
              <Play /> Try it in the sandbox
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/40">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
        <Badge variant="outline" className="font-mono text-[11px]">
          {method}
        </Badge>
        <code className="flex-1 truncate font-mono text-xs text-muted-foreground">
          {path}
        </code>
        <Button size="sm" onClick={send} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Play />}
          Run it now
        </Button>
      </div>

      {result && (
        <div className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Response</span>
            {"status" in result && (
              <Badge variant={ok ? "success" : "destructive"} className="font-mono">
                {result.status}
              </Badge>
            )}
          </div>
          <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-[#0d1117] p-3 font-mono text-[12px] leading-relaxed text-foreground/90">
            {"error" in result
              ? result.error
              : JSON.stringify(result.body, null, 2)}
          </pre>
        </div>
      )}

      {!result && (
        <p className="px-4 py-3 text-xs text-muted-foreground">
          Runs live against your environment using the app&apos;s server-side
          credentials and your session. Sign in to the dashboard first for
          authenticated reads.
        </p>
      )}
    </div>
  );
}
