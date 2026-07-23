/**
 * End-to-end happy path: signup -> verify-email -> KYC -> free-tier provision -> trade -> close.
 *
 * This test assumes the v2 API is running at HSC_API_BASE_URL (default
 * http://localhost:8000) with Stripe disabled (we only exercise the
 * free-tier path) and the entity miner mocked to return a synthetic
 * subaccount on `POST /api/create-subaccount`.
 *
 * Run with: `pnpm test:e2e`.
 */
import { expect, test } from "@playwright/test";

test.describe("onboarding happy path", () => {
  test.skip(
    !process.env.E2E_RUN_ONBOARDING,
    "Set E2E_RUN_ONBOARDING=1 once the local API + miner are wired up.",
  );

  test("signup, verify, free provision, trade, close", async ({ page }) => {
    await page.goto("/signup");
    const email = `e2e+${Date.now()}@example.com`;
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "Sup3rSecret!");
    await page.click('button[type="submit"]');

    // We can't read the OTP from the email in this harness; the test runner
    // is expected to expose a helper that pulls it out of the dev SMTP
    // sink. See vanta-starter/README.md.
    const otp = process.env.E2E_OTP ?? "000000";
    await page.fill('input[name="code"]', otp);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard**");
    await expect(page.locator("h1")).toContainText(/Welcome|dashboard/i);

    await page.goto("/dashboard/checkout");
    await page.getByRole("button", { name: "Provision now" }).first().click();

    await page.waitForURL("**/dashboard/trading**");
    await page.getByPlaceholder("Pair").fill("BTC/USD");
    await page.getByRole("button", { name: "Submit market order" }).click();
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Order submitted/i })).toBeVisible();

    await page.getByRole("button", { name: "Close" }).first().click();
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Closed/i })).toBeVisible();
  });
});
