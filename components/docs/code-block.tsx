import "server-only";

import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/copy-button";
import { highlight, type CodeLang } from "@/lib/docs/highlight";

export type { CodeLang };

export async function CodeBlock({
  code,
  lang = "bash",
  filename,
  copy = true,
  className,
}: {
  code: string;
  lang?: CodeLang;
  filename?: string;
  copy?: boolean;
  className?: string;
}) {
  const html = await highlight(code, lang);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-[#0d1117]",
        className,
      )}
    >
      {(filename || copy) && (
        <div className="flex items-center justify-between border-b border-border/60 bg-black/20 px-4 py-2">
          <span className="font-mono text-xs text-muted-foreground">
            {filename ?? lang}
          </span>
          {copy && (
            <CopyButton
              value={code}
              label="Copy"
              className="h-7 border-border/60 bg-transparent px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}
        </div>
      )}
      <div
        className="shiki-host overflow-x-auto p-4 text-[13px] leading-relaxed [&_pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
