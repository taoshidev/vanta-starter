/**
 * Marketing / landing page smoke tests. These render entirely from local data
 * (no hyperscaled-api calls), so they run against a bare `pnpm dev` with no
 * backend, database, or credentials.
 */
import { expect, test } from "@playwright/test";

import { MarketingPage } from "./fixtures/pages";

test.describe("landing page", () => {
  test("renders the hero and primary CTAs", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();

    await expect(home.heroHeading()).toContainText(/Ship a prop-trading product/i);
    await expect(home.navLink("Sign in")).toBeVisible();
    await expect(home.navLink(/Get started/)).toBeVisible();
  });

  test("'Get started' navigates to signup", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();
    await home.navLink(/Get started/).click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("'Read the quickstart' navigates into the docs", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Read the quickstart/i }).click();
    await expect(page).toHaveURL(/\/docs\/quickstart$/);
  });

  test("the header docs link opens the docs index", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();
    await home.navLink("Docs").click();
    await expect(page).toHaveURL(/\/docs$/);
  });
});
