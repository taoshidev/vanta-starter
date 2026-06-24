import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("title-cases the status and replaces underscores", () => {
    const { getByText } = render(<StatusBadge status="needs_input" />);
    expect(getByText("Needs Input")).toBeInTheDocument();
  });

  it("uses the success tone for verified-like states", () => {
    const { getByText } = render(<StatusBadge status="verified" />);
    expect(getByText("Verified").className).toContain("text-success");
  });

  it("uses the warning tone for pending-like states", () => {
    const { getByText } = render(<StatusBadge status="pending" />);
    expect(getByText("Pending").className).toContain("text-warning");
  });

  it("uses the destructive tone for failed-like states", () => {
    const { getByText } = render(<StatusBadge status="failed" />);
    expect(getByText("Failed").className).toContain("text-destructive");
  });

  it("falls back to Unknown + outline for null/undefined", () => {
    const { getByText } = render(<StatusBadge status={null} />);
    const el = getByText("Unknown");
    expect(el.className).toContain("text-muted-foreground");
  });

  it("falls back to the outline tone for unrecognized statuses", () => {
    const { getByText } = render(<StatusBadge status="weird_state" />);
    expect(getByText("Weird State").className).toContain("text-muted-foreground");
  });
});
