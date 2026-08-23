import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BookOpen,
  CandlestickChart,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Terminal,
  Webhook,
  Zap,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { PORTAL_DOCS_ONLY, SANDBOX_URL } from "@/lib/portal";
import { CodeBlock } from "@/components/docs/code-block";
import { ArchitectureDiagram } from "@/components/docs/architecture-diagram";
import { Aurora, HoverLift, Parallax, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  { icon: ShieldCheck, title: "Identity & KYC", desc: "Sumsub ID + liveness verification wired end-to-end.", href: "/docs/kyc" },
  { icon: CreditCard, title: "Payments", desc: "Stripe checkout for challenge purchases and funded accounts.", href: "/docs/checkout" },
  { icon: CandlestickChart, title: "Live trading", desc: "Submit, edit, close, TP/SL — the full order lifecycle.", href: "/docs/trading" },
  { icon: Banknote, title: "Payouts", desc: "Stripe Connect Express onboarding + bank transfers.", href: "/docs/payouts" },
  { icon: KeyRound, title: "API keys", desc: "Programmatic trading access with scoped, revocable keys.", href: "/docs/api-keys" },
  { icon: Webhook, title: "Webhooks", desc: "Signed, real-time events for KYC, payments, and trades.", href: "/docs/webhooks" },
];

const STEPS = [
  { n: "01", title: "Get a token", desc: "Exchange client credentials for an OAuth access token." },
  { n: "02", title: "Onboard a user", desc: "Sign up, verify email, and run KYC in minutes." },
  { n: "03", title: "Fund an account", desc: "Create a Stripe checkout and provision a funded account." },
  { n: "04", title: "Trade & pay out", desc: "Place orders and send earned profit via Connect." },
];

const SNIPPET = `import { auth, payments, trading } from "@hyperscaled/sdk";

// 1. Your app authenticates once (OAuth client credentials)
const session = await auth.login(email, password);

// 2. Sell a funded challenge with Stripe
const checkout = await payments.checkout({
  tier_id: "tier_25k",
  account_size: 25_000,
  amount_cents: 19_900,
});

// 3. Place a live order on the funded account
await trading.submit(
  { trade_pair: "BTCUSD", order_type: "LONG", leverage: 1.0 },
  propAccountId,
);`;

export default function HomePage() {
  return (
    <div className="relative">
      <header className="glass sticky top-0 z-40 border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-foreground">
            <Brand />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/docs">
                <BookOpen className="size-4" /> Docs
              </Link>
            </Button>
            {PORTAL_DOCS_ONLY ? (
              <Button asChild>
                <Link href="/request-access">
                  Request access <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">
                    Get started <ArrowRight />
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <Aurora />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(60rem 40rem at 50% 0%, black, transparent 75%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div>
              <Reveal>
                <Badge variant="outline" className="mb-5 backdrop-blur">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  Powered by the Hyperscaled API
                </Badge>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                  Ship a prop-trading product.{" "}
                  <span className="bg-gradient-to-r from-primary via-emerald-400 to-sky-400 bg-clip-text text-transparent">
                    Your brand, our rails.
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                  One REST API for identity, payments, funded accounts, live
                  trading, and payouts. Integrate in an afternoon — we run the
                  custody, settlement, and market plumbing.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button size="lg" asChild>
                    {PORTAL_DOCS_ONLY ? (
                      <Link href="/request-access">
                        Request API access <ArrowRight />
                      </Link>
                    ) : (
                      <Link href="/signup">
                        Create your account <ArrowRight />
                      </Link>
                    )}
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/docs/quickstart">
                      <Terminal className="size-4" /> Read the quickstart
                    </Link>
                  </Button>
                </div>
                {PORTAL_DOCS_ONLY && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    The interactive demo — signup, Sumsub KYC, the purchase flow,
                    webhooks and the trading dashboard — is not available on this
                    site: it would create real accounts. Try those in the{" "}
                    <a
                      href={SANDBOX_URL}
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      sandbox
                    </a>
                    .
                  </p>
                )}
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-10 flex items-center gap-6 opacity-70">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Built on
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/stripe.svg" alt="Stripe" className="h-5 w-auto" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    Sumsub
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/hyperscaled-wordmark.svg"
                    alt="Hyperscaled"
                    className="h-4 w-auto opacity-80"
                  />
                </div>
              </Reveal>
            </div>

            <Parallax distance={40} className="relative">
              <div className="rounded-2xl border border-border bg-card/60 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-3">
                  <span className="size-3 rounded-full bg-destructive/60" />
                  <span className="size-3 rounded-full bg-warning/60" />
                  <span className="size-3 rounded-full bg-success/60" />
                  <span className="ml-3 font-mono text-xs text-muted-foreground">
                    integrate.ts
                  </span>
                </div>
                <CodeBlock code={SNIPPET} lang="typescript" copy={false} />
              </div>
            </Parallax>
          </div>
        </section>

        {/* Architecture */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              One integration, the entire stack
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your app talks to a single authenticated API. We orchestrate
              payments, identity, and the trading network behind it.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ArchitectureDiagram />
          </Reveal>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <Reveal className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything a prop firm needs
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Each capability ships with docs, copy-paste examples, and a live
              “run it now” sandbox.
            </p>
          </Reveal>
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, href }) => (
              <StaggerItem key={title}>
                <HoverLift>
                  <Link href={href}>
                    <Card className="group h-full p-6 transition-colors hover:border-primary/40">
                      <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="flex items-center gap-1.5 font-semibold">
                        {title}
                        <ArrowRight className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                    </Card>
                  </Link>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Steps */}
        <section className="border-y border-border bg-card/20">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal className="mb-10">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                From zero to first payout
              </h2>
            </Reveal>
            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <StaggerItem key={s.n}>
                  <Card className="h-full p-6">
                    <div className="font-mono text-sm text-primary">{s.n}</div>
                    <div className="mt-3 font-semibold">{s.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <Card className="relative overflow-hidden p-10 text-center sm:p-16">
              <Aurora />
              <div className="relative">
                <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Zap className="size-6" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                  Start building today
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  {PORTAL_DOCS_ONLY
                    ? "Request access to get your client credentials, then build against the API with the docs and the sandbox."
                    : "Create an account, grab your API token, and run your first live request straight from the docs."}
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Button size="lg" asChild>
                    {PORTAL_DOCS_ONLY ? (
                      <Link href="/request-access">
                        Request access <ArrowRight />
                      </Link>
                    ) : (
                      <Link href="/signup">
                        Get started <ArrowRight />
                      </Link>
                    )}
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/docs">
                      <BookOpen className="size-4" /> Explore the docs
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Link href="/" className="text-foreground">
            <Brand />
          </Link>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/hyperscaled-wordmark.svg" alt="Hyperscaled" className="h-4 w-auto" />
          </div>
        </div>
      </footer>
    </div>
  );
}
