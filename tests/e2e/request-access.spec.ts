/**
 * Self-service "Request API access" page. We cover rendering + client-side
 * validation only; the submit path runs a server action that POSTs to the live
 * `POST /v2/app-requests` endpoint, so the happy path is gated behind a backend
 * (see onboarding.spec.ts for the pattern).
 */
import { expect, test } from "@playwright/test";

import { RequestAccessPage } from "./fixtures/pages";

test.describe("request access", () => {
  test("renders every field", async ({ page }) => {
    const req = new RequestAccessPage(page);
    await req.goto();

    await expect(page.getByRole("heading", { name: "Request API access" })).toBeVisible();
    for (const name of [
      "company_name",
      "slug",
      "contact_name",
      "contact_email",
      "website",
      "use_case",
    ]) {
      await expect(req.field(name)).toBeVisible();
    }
  });

  test("the slug field constrains input to a lowercase pattern", async ({ page }) => {
    const req = new RequestAccessPage(page);
    await req.goto();
    const pattern = await req.field("slug").getAttribute("pattern");
    expect(pattern).toBe("[a-z0-9][a-z0-9-]*");
  });

  test("empty required fields block submission", async ({ page }) => {
    const req = new RequestAccessPage(page);
    await req.goto();
    await req.submit().click();
    // Required validation keeps us on the page.
    await expect(page).toHaveURL(/\/request-access$/);
    await expect(req.field("company_name")).toBeFocused();
  });

  test("links back to sign in for existing tenants", async ({ page }) => {
    const req = new RequestAccessPage(page);
    await req.goto();
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
  });
});
