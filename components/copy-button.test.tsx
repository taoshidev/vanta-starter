import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { CopyButton } from "./copy-button";

const writeText = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // happy-dom exposes navigator.clipboard as a getter-only property, so assign
  // via defineProperty rather than Object.assign.
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
});
afterEach(() => vi.restoreAllMocks());

describe("CopyButton", () => {
  it("renders the provided label", () => {
    const { getByRole } = render(<CopyButton value="secret" label="Copy key" />);
    expect(getByRole("button", { name: /Copy key/ })).toBeInTheDocument();
  });

  it("writes the value to the clipboard and toasts on success", async () => {
    writeText.mockResolvedValue(undefined);
    const { getByRole } = render(<CopyButton value="hsk_secret" />);
    fireEvent.click(getByRole("button"));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("hsk_secret"));
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard");
  });

  it("toasts an error when the clipboard write fails", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const { getByRole } = render(<CopyButton value="x" />);
    fireEvent.click(getByRole("button"));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't copy to clipboard"));
  });
});
