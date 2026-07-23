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

    await expect(home.heroHeading()).toContainText(/Trade with our capital/i);
    await expect(home.navLink("Sign in")).toBeVisible();
    await expect(home.navLink(/Start a challenge/)).toBeVisible();
  });

  test("'Start a challenge' navigates to signup", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();
    await home.navLink(/Start a challenge/).click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("'How it works' scrolls to the journey section", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /How it works/i }).first().click();
    await expect(page.locator("#how-it-works")).toBeVisible();
  });

  test("the header docs link opens the docs index", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();
    await home.navLink("Docs").click();
    await expect(page).toHaveURL(/\/docs$/);
  });
});
