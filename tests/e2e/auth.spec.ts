/**
 * Auth page tests: rendering, native client-side validation, and cross-links.
 * No backend required — we never submit a valid request, so the server action
 * is not exercised (the happy-path login/signup lives in onboarding.spec.ts).
 */
import { expect, test } from "@playwright/test";

import { LoginPage, SignupPage } from "./fixtures/pages";

test.describe("login page", () => {
  test("renders the form and links", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(login.email()).toBeVisible();
    await expect(login.password()).toBeVisible();
    await expect(page.getByRole("link", { name: /Create an account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Forgot your password/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Request access/i })).toBeVisible();
  });

  test("blocks submit with empty required fields (stays on /login)", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.submit().click();

    // Native required validation should keep focus on the page; no navigation.
    await expect(page).toHaveURL(/\/login$/);
    await expect(login.email()).toBeFocused();
  });

  test("the email field enforces email formatting", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    const valid = await login.email().evaluate(
      (el: HTMLInputElement) => el.type === "email",
    );
    expect(valid).toBe(true);
  });
});

test.describe("signup page", () => {
  test("renders the form and a link back to login", async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();

    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(signup.email()).toBeVisible();
    await expect(signup.password()).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
  });

  test("password requires a minimum length", async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();
    const min = await signup.password().getAttribute("minlength");
    expect(Number(min)).toBeGreaterThanOrEqual(8);
  });
});

test.describe("reset-password page", () => {
  test("renders", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.locator("form")).toBeVisible();
  });
});
