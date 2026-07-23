import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BookOpen,
  CandlestickChart,
  Gauge,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { Aurora, HoverLift, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND_MARK_LETTER, BRAND_NAME } from "@/lib/brand";

const HERO_HEADLINE = "Trade with our capital.";
const HERO_SUPPORT =
  "Pass a PropFund challenge, get a funded account, and keep the majority of what you earn.";

const PRIMARY_CTA_LABEL = "Start a challenge";
const SECONDARY_CTA_LABEL = "How it works";

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Pick your challenge",
    desc: "Choose an account size that matches your strategy and risk tolerance.",
  },
  {
    n: "02",
    title: "Prove your edge",
    desc: "Hit profit targets while staying inside PropFund drawdown and risk rules.",
  },
  {
    n: "03",
    title: "Trade funded",
    desc: "Get a live funded account and trade markets with PropFund capital.",
  },
  {
    n: "04",
    title: "Withdraw profits",
    desc: "Request payouts on your share — verified, tracked, and paid out fast.",
  },
] as const;

const PILLARS = [
  {
    icon: Wallet,
    title: "Real funding",
    desc: "Trade PropFund capital after you pass evaluation — not a simulated trophy account.",
  },
  {
    icon: Target,
    title: "Clear rules",
    desc: "Transparent profit targets, drawdown limits, and daily loss rules. No hidden gotchas.",
  },
  {
    icon: CandlestickChart,
    title: "Live markets",
    desc: "Submit, manage, and close positions with the full order lifecycle traders expect.",
  },
  {
    icon: Banknote,
    title: "Trader payouts",
    desc: "Keep the majority of profits. Connect your bank and withdraw when you hit milestones.",
  },
  {
    icon: ShieldCheck,
    title: "Verified traders",
    desc: "Identity and KYC built in so funding and payouts stay compliant and secure.",
  },
  {
    icon: Gauge,
    title: "Risk discipline",
    desc: "PropFund monitors risk in real time so capital stays protected — and so do you.",
  },
] as const;

const ACCOUNT_TIERS = [
  { size: "$25K", split: "80%", label: "Starter" },
  { size: "$50K", split: "80%", label: "Growth" },
  { size: "$100K", split: "90%", label: "Pro" },
] as const;

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
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                {PRIMARY_CTA_LABEL} <ArrowRight />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero — brand-first PropFund composition */}
        <section className="relative overflow-hidden border-b border-border">
          <Aurora />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(60rem 40rem at 50% 0%, black, transparent 75%)",
            }}
          />
          {/* Atmospheric mark watermark */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 top-1/2 hidden -translate-y-1/2 select-none text-[18rem] font-semibold leading-none text-primary/[0.06] sm:block lg:right-[8%] lg:text-[22rem]"
          >
            {BRAND_MARK_LETTER}
          </div>

          <div className="relative mx-auto flex max-w-6xl flex-col items-start px-6 py-24 sm:py-32 lg:py-36">
            <Reveal>
              <Badge variant="outline" className="mb-6 backdrop-blur">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                Prop trading · Funded accounts
              </Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-primary">
                {BRAND_NAME}
              </p>
              <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                {HERO_HEADLINE}{" "}
                <span className="bg-gradient-to-r from-primary via-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  Keep what you earn.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">{HERO_SUPPORT}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    {PRIMARY_CTA_LABEL} <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#how-it-works">{SECONDARY_CTA_LABEL}</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Account sizes */}
        <section className="border-b border-border bg-card/20">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <Reveal className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Capital sized for how you trade
              </h2>
              <p className="mt-2 text-muted-foreground">
                Start with the account that fits your plan. Scale up as you prove consistency.
              </p>
            </Reveal>
            <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {ACCOUNT_TIERS.map((tier) => (
                <StaggerItem key={tier.size}>
                  <div className="border-t border-primary/40 pt-5">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {tier.label}
                    </div>
                    <div className="mt-2 text-4xl font-semibold tracking-tight">{tier.size}</div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="size-4 text-primary" />
                      Up to {tier.split} profit split
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <Reveal className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How {BRAND_NAME} works
            </h2>
            <p className="mt-2 text-muted-foreground">
              A straightforward path from challenge to funded trading to payout.
            </p>
          </Reveal>
          <Stagger className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <StaggerItem key={step.n}>
                <div className="font-mono text-sm text-primary">{step.n}</div>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Pillars */}
        <section className="border-y border-border bg-card/20">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Built for serious traders
              </h2>
              <p className="mt-2 text-muted-foreground">
                {BRAND_NAME} combines funded capital with institutional-grade onboarding,
                risk controls, and payouts.
              </p>
            </Reveal>
            <Stagger className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {PILLARS.map(({ icon: Icon, title, desc }) => (
                <StaggerItem key={title}>
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden">
          <Aurora />
          <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
            <Reveal>
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
                {BRAND_NAME}
              </p>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
                Ready to trade with our capital?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Create your account, pass verification, and start a challenge when you&apos;re
                ready.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    {PRIMARY_CTA_LABEL} <ArrowRight />
                  </Link>
                </Button>
                <HoverLift>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Already a trader? Sign in</Link>
                  </Button>
                </HoverLift>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Link href="/" className="text-foreground">
            <Brand />
          </Link>
          <p>
            © {new Date().getFullYear()} {BRAND_NAME}. Trade responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}
