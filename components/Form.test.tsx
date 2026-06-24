import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { ErrorBanner, Field, InfoBanner, SubmitButton } from "./Form";

describe("ErrorBanner / InfoBanner", () => {
  it("render nothing when empty", () => {
    const { container: a } = render(<ErrorBanner />);
    const { container: b } = render(<InfoBanner />);
    expect(a).toBeEmptyDOMElement();
    expect(b).toBeEmptyDOMElement();
  });

  it("render their message when given children", () => {
    const { getByText } = render(<ErrorBanner>Bad credentials</ErrorBanner>);
    expect(getByText("Bad credentials")).toBeInTheDocument();
  });

  it("InfoBanner renders its message", () => {
    const { getByText } = render(<InfoBanner>Check your inbox</InfoBanner>);
    expect(getByText("Check your inbox")).toBeInTheDocument();
  });
});

describe("Field", () => {
  it("associates the label with the input via id derived from name", () => {
    const { getByLabelText } = render(<Field label="Email" name="email" />);
    const input = getByLabelText("Email") as HTMLInputElement;
    expect(input.id).toBe("email");
  });

  it("renders a hint", () => {
    const { getByText } = render(<Field label="Password" name="password" hint="8+ chars" />);
    expect(getByText("8+ chars")).toBeInTheDocument();
  });

  it("marks the input invalid and shows error text", () => {
    const { getByLabelText, getByText } = render(
      <Field label="Email" name="email" error="Required" />,
    );
    expect(getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(getByText("Required")).toBeInTheDocument();
  });
});

describe("SubmitButton", () => {
  it("renders the idle label and is a submit button", () => {
    const { getByRole } = render(<SubmitButton label="Sign in" />);
    const btn = getByRole("button", { name: "Sign in" });
    expect(btn).toHaveAttribute("type", "submit");
  });
});
