import { describe, expect, it } from "vitest";

import { DOCS_FOR_ROUTE, DOCS_NAV } from "./nav";

describe("DOCS_NAV", () => {
  it("has the expected top-level groups", () => {
    expect(DOCS_NAV.map((g) => g.title)).toEqual([
      "Getting started",
      "Flows",
      "Reference",
    ]);
  });

  it("every item has a non-empty label and a /docs href", () => {
    for (const group of DOCS_NAV) {
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) {
        expect(item.label.trim().length).toBeGreaterThan(0);
        expect(item.href.startsWith("/docs")).toBe(true);
      }
    }
  });

  it("has no duplicate hrefs", () => {
    const hrefs = DOCS_NAV.flatMap((g) => g.items.map((i) => i.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("DOCS_FOR_ROUTE", () => {
  it("maps every dashboard route to a documented /docs page in the nav", () => {
    const navHrefs = new Set(DOCS_NAV.flatMap((g) => g.items.map((i) => i.href)));
    for (const [route, docHref] of Object.entries(DOCS_FOR_ROUTE)) {
      expect(route.startsWith("/dashboard")).toBe(true);
      expect(navHrefs.has(docHref)).toBe(true);
    }
  });

  it("includes the dashboard overview mapping", () => {
    expect(DOCS_FOR_ROUTE["/dashboard"]).toBe("/docs");
  });
});
