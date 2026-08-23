import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { Callout, DocSection } from "@/components/docs/blocks";

export const metadata = { title: "Quickstart" };

export default function QuickstartPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Getting started</p>
        <h1 className="text-3xl font-semibold tracking-tight">Quickstart</h1>
        <p className="text-lg text-muted-foreground">
          Run the full stack locally — the <code>hyperscaled-api</code> backend
          plus this <code>vanta-starter</code> frontend — in about ten minutes.
        </p>
      </header>

      <Callout type="info" title="What you'll need">
        Python 3.11+, Node 20+ with <code>pnpm</code>, Docker Desktop, and the
        Stripe CLI (only for testing payments/payouts locally).
      </Callout>

      <DocSection title="1. Start Postgres & Redis" description="The API persists tenants, users, and payments in Postgres and uses Redis for caching/rate-limits.">
        <CodeBlock
          lang="bash"
          filename="hyperscaled-api"
          code={`# from the hyperscaled-api repo root
docker compose up -d        # Postgres (5433) + Redis (6379)
docker compose ps`}
        />
        <Callout type="warning" title="Port 5433, not 5432">
          The compose file maps Postgres to host port <code>5433</code> to avoid
          colliding with a native Postgres on <code>5432</code>. Make sure{" "}
          <code>V2_DATABASE_URL</code> points at <code>5433</code>.
        </Callout>
      </DocSection>

      <DocSection title="2. Configure & migrate the API">
        <CodeBlock
          lang="bash"
          filename="hyperscaled-api"
          code={`conda activate hyperscaled        # or your venv
pip install -e .

cp .env.example .env              # then fill in the values below
alembic upgrade head              # create all tables`}
        />
        <CodeBlock
          lang="bash"
          filename="hyperscaled-api/.env (essentials)"
          code={`V2_DATABASE_URL=postgresql+asyncpg://hyperscaled:hyperscaled@localhost:5433/hyperscaled_api
V2_REDIS_URL=redis://localhost:6379/0
# 64 hex chars = a 32-byte AES-256-GCM key. Generate with:
#   python -c "import secrets; print(secrets.token_hex(32))"   (or: openssl rand -hex 32)
# base64 will NOT work: the API boots fine and then 500s on the first encrypt.
SESSION_ENCRYPTION_KEY=<64 hex chars>

# Stripe (test mode)
V2_STRIPE_SECRET_KEY=sk_test_...
V2_STRIPE_PUBLISHABLE_KEY=pk_test_...
# Comma-separated: a Connect platform needs a second Stripe endpoint (and
# secret) for connected-account events. All configured secrets are tried.
V2_STRIPE_WEBHOOK_SECRET=whsec_account,whsec_connect

# Sumsub KYC
V2_SUMSUB_APP_TOKEN=...
V2_SUMSUB_SECRET_KEY=...

# Email OTP (SMTP relay)
V2_SMTP_HOST=smtp-relay.gmail.com
V2_SMTP_USERNAME=...
V2_SMTP_PASSWORD=...

# Validator / trading network
HYPERSCALED_VALIDATOR_API_KEY=...`}
        />
      </DocSection>

      <DocSection title="3. Run the API">
        <CodeBlock
          lang="bash"
          filename="hyperscaled-api"
          code={`uvicorn hyperscaled_api.main:app --reload --port 8000`}
        />
        <p className="text-sm text-muted-foreground">
          The interactive API reference (Swagger UI) is now live at{" "}
          <code>http://localhost:8000/docs</code>.
        </p>
      </DocSection>

      <DocSection title="4. Create an admin + register your app (tenant)" description="Each app that integrates is a tenant with its own OAuth client credentials. Create them from the admin dashboard — no production terminal required.">
        <CodeBlock
          lang="bash"
          filename="hyperscaled-api"
          code={`# Create the first admin. Run from the hyperscaled-api repo root.
# The password is prompted for interactively (hidden, 12 chars minimum) —
# do not pass it on the command line or in an env var.
python scripts/create_admin.py --email you@taoshi.io --name "You"

# Alternatively, for local auto-seed: set V2_ADMIN_EMAIL and V2_ADMIN_PASSWORD
# (optionally V2_ADMIN_NAME) before starting uvicorn. The API seeds a superadmin
# on startup only when both are set and the admins table is empty. Settings use
# env_prefix="V2_", so unprefixed ADMIN_EMAIL / ADMIN_PASSWORD do nothing.

# Sign in, enroll TOTP (forced on first login), then "Register app"
open http://localhost:8000/admin/login`}
        />
        <Callout type="tip" title="Save the client secret">
          Registering an app returns a <code>client_id</code> and a{" "}
          <code>client_secret</code> shown <strong>once</strong>. Copy them into
          the frontend env below.
        </Callout>
        <Callout type="warning" title="Give the operator your Connect return URLs">
          Stripe sends your users back to <em>your</em> site after Connect
          onboarding, so the return and refresh URLs are stored per tenant on
          your app row — they are not an API-wide setting. When you register the
          app, set both to this app&apos;s payouts page:
          <br />
          <code>connect_return_url</code> ={" "}
          <code>{"<your-origin>"}/dashboard/payouts?onboarding=return</code>
          <br />
          <code>connect_refresh_url</code> ={" "}
          <code>{"<your-origin>"}/dashboard/payouts?onboarding=refresh</code>
          <br />
          An operator sets them in the admin console or via{" "}
          <code>PATCH /v2/admin/apps/{"{app_id}"}</code>. Until they are set,{" "}
          <code>POST /v2/connect/accounts</code> returns{" "}
          <code>409 V2_CONNECT_URLS_NOT_CONFIGURED</code> and no user can link a
          bank account.
        </Callout>
      </DocSection>

      <DocSection title="5. Configure & run this app">
        <CodeBlock
          lang="bash"
          filename="vanta-starter/.env.local"
          code={`HSC_API_BASE_URL=http://localhost:8000
HSC_CLIENT_ID=hsc_...
HSC_CLIENT_SECRET=hsk_...
HSC_SCOPE=api

SESSION_COOKIE_NAME=hsc_starter_session
SESSION_COOKIE_SECRET=<32+ char secret>

NEXT_PUBLIC_HSC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`}
        />
        <CodeBlock
          lang="bash"
          filename="vanta-starter"
          code={`pnpm install
pnpm dev          # http://localhost:3000`}
        />
      </DocSection>

      <DocSection title="6. (Optional) Forward Stripe webhooks" description="Payments and Connect status updates arrive via webhook. Forward them to the API while developing.">
        <CodeBlock
          lang="bash"
          filename="terminal"
          code={`# use --api-key so the CLI listens on the SAME Stripe account as your keys
stripe listen \\
  --api-key sk_test_... \\
  --forward-to localhost:8000/v2/webhooks/stripe

# copy the whsec_... it prints into V2_STRIPE_WEBHOOK_SECRET, then restart uvicorn`}
        />
        <Callout type="warning" title="Restart after changing .env">
          <code>uvicorn --reload</code> does not reload environment variables.
          Restart the process after editing <code>.env</code>.
        </Callout>
      </DocSection>

      <DocSection title="Next steps">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <Link href="/docs/authentication">Authentication</Link> — how tokens
            and sessions work.
          </li>
          <li>
            <Link href="/docs/kyc">Identity / KYC</Link> — verify a trader.
          </li>
          <li>
            <Link href="/docs/checkout">Checkout</Link> — sell your first
            challenge.
          </li>
        </ul>
      </DocSection>
    </>
  );
}
