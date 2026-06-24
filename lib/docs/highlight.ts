import "server-only";

import { createHighlighter, type Highlighter } from "shiki";

export type CodeLang = "bash" | "json" | "typescript" | "tsx" | "python" | "http";

// One WASM highlighter per server process, preloaded with the grammars/theme
// the docs use.
let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-default"],
      langs: ["bash", "json", "typescript", "tsx", "python", "http"],
    });
  }
  return highlighterPromise;
}

export async function highlight(code: string, lang: CodeLang = "bash"): Promise<string> {
  const hl = await getHighlighter();
  return hl.codeToHtml(code.trimEnd(), { lang, theme: "github-dark-default" });
}
