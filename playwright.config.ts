import { defineConfig, devices } from "@playwright/test";

// E2E runs against a Next dev server on a dedicated port so it doesn't fight a
// developer's `pnpm dev` on :3000. Override with E2E_PORT / E2E_BASE_URL.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

// Set E2E_SKIP_WEB_SERVER=1 to target a server you started yourself (or a
// deployed environment via E2E_BASE_URL).
const SKIP_WEB_SERVER = process.env.E2E_SKIP_WEB_SERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: SKIP_WEB_SERVER
    ? undefined
    : {
        command: `pnpm next dev -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
