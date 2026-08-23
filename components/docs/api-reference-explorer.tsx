"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";

import type { DocsOperation } from "@/app/actions/docs";
import { ApiTester } from "@/components/docs/api-tester";
import { MethodBadge } from "@/components/docs/blocks";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

export type RefEndpoint = {
  method: string;
  path: string;
  summary: string;
  authLabel: string;
  note?: string;
  runOp?: DocsOperation;
  curl: string;
  curlHtml: string;
  requestLabel?: string;
  requestHtml?: string;
  responseHtml?: string;
};

export type RefArea = {
  id: string;
  title: string;
  description: string;
  docHref?: string;
  endpoints: RefEndpoint[];
};

function Code({ html }: { html: string }) {
  return (
    <div
      className="shiki-host overflow-x-auto rounded-lg border border-border bg-[#0d1117] p-3 text-[12.5px] leading-relaxed [&_pre]:!bg-transparent"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function EndpointRow({ ep }: { ep: RefEndpoint }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
      >
        <MethodBadge method={ep.method} />
        <code className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
          {ep.path}
        </code>
        <span className="hidden text-xs text-muted-foreground md:block">{ep.summary}</span>
        <Badge variant="outline" className="hidden shrink-0 text-[10px] sm:inline-flex">
          {ep.authLabel}
        </Badge>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/60 p-4">
          <p className="text-sm text-muted-foreground md:hidden">{ep.summary}</p>
          {ep.note && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Note:</span> {ep.note}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">cURL</span>
              <CopyButton value={ep.curl} label="Copy" className="h-7 px-2 text-xs" />
            </div>
            <Code html={ep.curlHtml} />
          </div>

          {ep.requestHtml && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                {ep.requestLabel ?? "Request body"}
              </span>
              <Code html={ep.requestHtml} />
            </div>
          )}

          {ep.responseHtml && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Response</span>
              <Code html={ep.responseHtml} />
            </div>
          )}

          {ep.runOp && <ApiTester operation={ep.runOp} method={ep.method} path={ep.path} />}
        </div>
      )}
    </div>
  );
}

export function ApiReferenceExplorer({ areas }: { areas: RefArea[] }) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = areas
    .filter((a) => !active || a.id === active)
    .map((a) => ({
      ...a,
      endpoints: a.endpoints.filter(
        (e) =>
          !q ||
          e.path.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.method.toLowerCase().includes(q),
      ),
    }))
    .filter((a) => a.endpoints.length > 0);

  const total = filtered.reduce((n, a) => n + a.endpoints.length, 0);

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-20 -mx-2 space-y-3 bg-background/80 px-2 py-3 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search endpoints by path, method, or description…"
            className="h-11 w-full rounded-lg border border-border bg-card/60 pl-10 pr-4 text-sm outline-none ring-ring transition-shadow placeholder:text-muted-foreground focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterPill label="All" activeWhen={active === null} onClick={() => setActive(null)} />
          {areas.map((a) => (
            <FilterPill
              key={a.id}
              label={a.title}
              activeWhen={active === a.id}
              onClick={() => setActive(a.id)}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{total} endpoints</p>
      </div>

      {filtered.map((a) => (
        <section key={a.id} id={a.id} className="scroll-mt-40 space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{a.title}</h2>
            <p className="text-sm text-muted-foreground">{a.description}</p>
          </div>
          <div className="space-y-2">
            {a.endpoints.map((ep) => (
              <EndpointRow key={`${ep.method}-${ep.path}`} ep={ep} />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No endpoints match “{query}”.
        </p>
      )}
    </div>
  );
}

function FilterPill({
  label,
  activeWhen,
  onClick,
}: {
  label: string;
  activeWhen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        activeWhen
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
