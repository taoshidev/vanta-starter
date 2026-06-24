import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "server-only": resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    // Colocated unit/integration tests live next to the source they cover
    // (modeled after vanta-ui), plus the standalone suites under tests/.
    // Playwright e2e specs use `.spec.ts` and are excluded here.
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "**/node_modules/**", "tests/e2e/**"],
  },
});
