import Link from "next/link";

import { Brand } from "@/components/brand";
import { Aurora, Reveal } from "@/components/motion";

/**
 * Centered, single-column auth layout: animated backdrop, a glass card with the
 * form, and a trust row. Shared by login / signup / verify-email / reset.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <Aurora />
      {/* Faint grid, faded toward the edges. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(40rem 40rem at 50% 40%, black, transparent 75%)",
        }}
      />

      <main className="relative w-full max-w-[26rem]">
        <Reveal y={16}>
          <div className="mb-8 flex flex-col items-center text-center">
            <Link
              href="/"
              className="mb-7 inline-flex text-foreground transition-opacity hover:opacity-80"
            >
              <Brand className="h-7" />
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </Reveal>

        <Reveal y={20} delay={0.08}>
          <div className="relative">
            {/* Soft glow behind the card. */}
            <div
              className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 blur-xl"
              style={{
                background:
                  "radial-gradient(20rem 12rem at 50% 0%, hsl(var(--primary) / 0.18), transparent 70%)",
              }}
            />
            <div className="relative rounded-2xl border border-border bg-card/70 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
              {/* Gradient hairline at the top edge. */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              {children}
            </div>
          </div>
        </Reveal>

        {footer && (
          <Reveal y={12} delay={0.16}>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </Reveal>
        )}

        <Reveal delay={0.24}>
          <div className="mt-10 flex items-center justify-center gap-5 opacity-50">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Secured by
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/stripe.svg" alt="Stripe" className="h-4 w-auto" />
            <span className="text-xs font-semibold text-muted-foreground">Sumsub</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/hyperscaled-wordmark.svg"
              alt="Hyperscaled"
              className="h-3.5 w-auto"
            />
          </div>
        </Reveal>
      </main>
    </div>
  );
}
