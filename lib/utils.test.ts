import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("resolves conflicting tailwind utilities (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm text-muted-foreground", "text-foreground")).toBe(
      "text-sm text-foreground",
    );
  });

  it("flattens array inputs", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});
