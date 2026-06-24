import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { Brand } from "./brand";

describe("Brand", () => {
  it("renders the Vanta SVG lockup by default", () => {
    const { getByRole } = render(<Brand />);
    const svg = getByRole("img", { name: "Vanta" });
    expect(svg.tagName.toLowerCase()).toBe("svg");
  });

  it("renders the mark-only SVG when the wordmark is hidden", () => {
    const { getByRole } = render(<Brand showWordmark={false} />);
    const svg = getByRole("img", { name: "Vanta" });
    // Mark-only viewBox differs from the full lockup.
    expect(svg.getAttribute("viewBox")).toBe("2 1 47 25");
  });

  it("renders the Hyperscaled wordmark as an <img>", () => {
    const { getByAltText } = render(<Brand brand="hyperscaled" />);
    const img = getByAltText("Hyperscaled") as HTMLImageElement;
    expect(img.tagName.toLowerCase()).toBe("img");
    expect(img.getAttribute("src")).toContain("hyperscaled-wordmark.svg");
  });

  it("forwards className", () => {
    const { getByRole } = render(<Brand className="custom-class" />);
    expect(getByRole("img", { name: "Vanta" }).getAttribute("class")).toContain("custom-class");
  });
});
