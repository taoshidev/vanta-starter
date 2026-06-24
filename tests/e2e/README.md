# E2E tests (Playwright)

Browser-level coverage for `vanta-starter`. The suite is split into two tiers:

| Tier | Specs | Needs backend? |
|---|---|---|
| **Offline** | `marketing.spec.ts`, `auth.spec.ts`, `request-access.spec.ts`, `docs.spec.ts` | No — these render from local data and only exercise client-side validation + navigation. A bare `pnpm dev` is enough. |
| **Full flow** | `onboarding.spec.ts` | Yes — a running `hyperscaled-api` (v2) with Stripe disabled and the entity miner mocked. Gated behind `E2E_RUN_ONBOARDING=1`. |

Page-object helpers live in `fixtures/pages.ts`. Prefer extending those over
duplicating selectors inside specs (mirrors the `vanta-ui` convention).

## Prerequisites

Install the browser once per machine:

```bash
pnpm exec playwright install --with-deps chromium
```

## Running

```bash
# Offline tier (no backend) — starts its own dev server on :3100
pnpm test:e2e

# A single spec
pnpm test:e2e tests/e2e/docs.spec.ts

# Filter by title
pnpm test:e2e -g "renders the hero"

# Full onboarding flow (requires a running API + mocked miner)
E2E_RUN_ONBOARDING=1 pnpm test:e2e tests/e2e/onboarding.spec.ts
```

The HTML report is written to `playwright-report/`; open it with
`pnpm exec playwright show-report`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `E2E_PORT` | `3100` | Port the test web server listens on (kept off `:3000` so it won't fight your `pnpm dev`). |
| `E2E_BASE_URL` | `http://localhost:${E2E_PORT}` | Target an already-running / deployed server. |
| `E2E_SKIP_WEB_SERVER` | unset | Set to `1` when you started the server yourself. |
| `E2E_RUN_ONBOARDING` | unset | Set to `1` to run the full signup → KYC → provision → trade flow. |
| `E2E_OTP` | `000000` | OTP the onboarding spec types on `/verify-email` (read it from your dev SMTP sink). |

## Why the offline tier exists

Most regressions in a starter app are broken links, missing form fields, and
client-validation drift — none of which need a database or Stripe. Keeping those
checks backend-free means they run anywhere (including CI) in seconds, while the
expensive full-flow spec stays opt-in.
