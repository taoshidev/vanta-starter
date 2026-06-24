"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Item = { id: string; text: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/**
 * "On this page" rail. Scans the rendered <article> for h2 headings, assigns
 * ids where missing, and tracks the active section with an IntersectionObserver.
 */
export function DocsToc() {
  const pathname = usePathname();
  const [items, setItems] = React.useState<Item[]>([]);
  const [active, setActive] = React.useState<string>("");

  React.useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const headings = Array.from(article.querySelectorAll("h2")) as HTMLElement[];
    const seen = new Set<string>();
    const collected: Item[] = headings.map((h) => {
      let id = h.id || slugify(h.textContent ?? "");
      while (id && seen.has(id)) id = `${id}-2`;
      seen.add(id);
      if (!h.id) h.id = id;
      return { id, text: h.textContent ?? "" };
    });
    setItems(collected);
    setActive(collected[0]?.id ?? "");

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [pathname]);

  if (items.length < 2) return null;

  return (
    <nav className="space-y-3" aria-label="On this page">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
        On this page
      </p>
      <ul className="space-y-1 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1 pl-3 text-sm transition-colors",
                active === item.id
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
