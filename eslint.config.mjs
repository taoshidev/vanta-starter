// Flat config for ESLint 9 + Next 15.
//
// `next lint` previously had nothing to read, so it dropped into its
// interactive setup prompt and hung CI. This keeps the recommended Next rules
// and turns off the stylistic ones that Prettier already owns.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // The API returns loosely-typed JSON in a few places; the client casts it
      // at the boundary. Warn rather than fail the build.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
