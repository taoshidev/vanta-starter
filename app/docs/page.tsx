import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Webhook,
} from "lucide-react";

import { CodeBlock } from "@/components/docs/code-block";
import { Callout } from "@/components/docs/blocks";

export const metadata = { title: "Introduction" };

const ADMIN_URL = `${
  process.env.NEXT_PUBLIC_HSC_API_BASE_URL ?? "http://localhost:8000"
}/admin`;

const FLOWS = [
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    desc: "Get the API and this app running locally in ~10 minutes.",
  },
  {
    href: "/docs/authentication",
    title: "Authentication",
    desc: "OAuth client credentials for your app + per-user sessions.",
    icon: KeyRound,
  },
  {
    href: "/docs/kyc",
    title: "Identity / KYC",
    desc: "Verify a trader's identity with Sumsub before they trade.",
    icon: ShieldCheck,
  },
  {
    href: "/docs/checkout",
    title: "Checkout & accounts",
    desc: "Sell prop challenges with Stripe and provision accounts.",
    icon: CreditCard,
  },
  {
    href: "/docs/trading",
    title: "Trading",
    desc: "Submit orders, manage positions and poll the trading desk.",
  },
  {
    href: "/docs/payouts",
    title: "Payouts & Connect",
    desc: "Onboard payees via Stripe Connect and send earned profit.",
  },
  {
    href: "/docs/api-keys",
    title: "API keys",
    desc: "Issue scoped programmatic credentials for your traders.",
    icon: KeyRound,
  },
  {
    href: "/docs/webhooks",
    title: "Webhooks",
    desc: "Receive real-time events: KYC, payments, payouts, trades.",
    icon: Webhook,
  },
  {
    href: "/docs/api-reference",
    title: "Full API reference",
    desc: "Search every endpoint, copy cURL, and run reads live.",
  },
];

export default function DocsIndexPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Hyperscaled API</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Build a prop-trading business on our infrastructure
        </h1>
        <p className="text-lg text-muted-foreground">
          The Hyperscaled API gives you everything behind a modern prop firm —
          identity verification, payments, funded accounts, live trading, and
          payouts — behind one multi-tenant REST API. This is the documentation
          for the same endpoints that power the <strong>Vanta</strong> reference
          app you&apos;re looking at.
        </p>
      </header>

      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Every call is authenticated, multi-tenant, and isolated to your app.
          You bring the UI; we run the regulated, capital, and market plumbing.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              1
            </span>
            <h2 className="text-lg font-semibold tracking-tight">
              Get your credentials
            </h2>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <p className="text-sm text-muted-foreground">
              Each integrating app is a <strong>tenant</strong> with its own
              OAuth <code>client_id</code> and <code>client_secret</code>. Request
              access and, once approved, you&apos;ll get a one-time link to
              retrieve them:
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>
                Submit the <strong>Request access</strong> form (company, contact,
                use case).
              </li>
              <li>
                We provision your network identity and <strong>approve</strong> the
                request — approval is manual.
              </li>
              <li>
                You receive an email with a <strong>one-time link</strong> to
                reveal your <code>client_id</code> and <code>client_secret</code>{" "}
                (the secret is shown <strong>once</strong>).
              </li>
            </ol>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href="/request-access"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Request access <ArrowRight className="size-3.5" />
              </Link>
              <a
                href={ADMIN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-card"
              >
                Admin console (operators) <ArrowUpRight className="size-3.5" />
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Running locally? You can self-approve from the admin console — see
              the <Link href="/docs/quickstart">Quickstart</Link>. Confirm an
              app&apos;s scopes and tenant identity anytime via{" "}
              <code>GET /v2/apps/me</code>. It does <strong>not</strong> return
              the <code>client_id</code> or the secret — both are shown only once,
              at the one-time reveal link, and <code>app_id</code> is a bare UUID,
              not the <code>hsc_</code>-prefixed <code>client_id</code>. The
              secret is rotate-only and never readable again.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              2
            </span>
            <h2 className="text-lg font-semibold tracking-tight">
              Make your first request
            </h2>
          </div>
          <CodeBlock
            lang="bash"
            filename="Your first request"
            code={`# 1. Exchange your app credentials for an access token (form-encoded, not JSON)
curl -X POST http://localhost:8000/v2/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d grant_type=client_credentials \\
  -d client_id=hsc_... \\
  -d client_secret=hsk_... \\
  -d scope=api

# 2. Use the token to call the API
curl http://localhost:8000/v2/auth/me \\
  -H "Authorization: Bearer <access_token>" \\
  -H "X-Session-Token: <end_user_session>"`}
          />
          <Callout type="tip" title="Two layers of auth">
            Your <strong>app</strong> authenticates with OAuth client credentials.
            Your <strong>end users</strong> get a session token after signing up /
            logging in, passed as <code>X-Session-Token</code>. See{" "}
            <Link href="/docs/authentication">Authentication</Link>.
          </Callout>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Explore the flows</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FLOWS.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{f.title}</h3>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
