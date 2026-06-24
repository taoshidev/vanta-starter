"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  createCheckoutAction,
  createFreeAccountAction,
  listPropAccountsAction,
} from "@/app/actions/onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { Tier } from "./page";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentForm({ onDone }: { onDone: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function pay() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    setSubmitting(false);
    if (error) {
      toast.error(error.message ?? "Payment failed.");
    } else {
      toast.success("Payment confirmed — provisioning your account.");
      onDone();
    }
  }

  return (
    <div className="space-y-5">
      <PaymentElement />
      <Button onClick={pay} loading={submitting} className="w-full" disabled={!stripe}>
        Pay now
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Test mode — use card 4242 4242 4242 4242, any future date and CVC.
      </p>
    </div>
  );
}

export function CheckoutPicker({ tiers }: { tiers: Tier[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  // Account ids that existed before this purchase, so we can detect the new one.
  const baselineIds = useRef<Set<string>>(new Set());

  async function pick(tier: Tier) {
    setPending(tier.id);
    try {
      if (tier.amount_cents === 0) {
        const r = await createFreeAccountAction({
          tier_id: tier.id,
          asset_class: tier.asset_class,
          account_size: tier.account_size,
        });
        if (r.ok && r.data) {
          toast.success("Free account provisioned.");
          router.push(`/dashboard/trading?prop=${r.data.id}`);
        } else if (!r.ok) {
          toast.error(friendlyError(r.code, r.message));
        }
      } else {
        const r = await createCheckoutAction({
          tier_id: tier.id,
          market: tier.asset_class,
          asset_class: tier.asset_class,
          account_size: tier.account_size,
          amount_cents: tier.amount_cents,
        });
        if (r.ok && r.data) {
          if (!stripePromise) {
            toast.error("Stripe publishable key is not configured.");
            return;
          }
          const pre = await listPropAccountsAction();
          baselineIds.current = new Set(
            pre.ok && pre.data ? pre.data.map((a) => a.id) : []
          );
          setClientSecret(r.data.client_secret);
        } else if (!r.ok) {
          toast.error(friendlyError(r.code, r.message));
        }
      }
    } finally {
      setPending(null);
    }
  }

  // Provisioning happens async via the Stripe webhook, so poll until the new
  // account shows up (or give up and let the dashboard catch it on next load).
  async function waitForNewAccount() {
    setClientSecret(null);
    setProvisioning(true);
    const deadline = Date.now() + 30_000;
    let newId: string | null = null;
    while (Date.now() < deadline) {
      const r = await listPropAccountsAction();
      if (r.ok && r.data) {
        const fresh = r.data.find((a) => !baselineIds.current.has(a.id));
        if (fresh) {
          newId = fresh.id;
          break;
        }
      }
      await new Promise((res) => setTimeout(res, 1500));
    }
    setProvisioning(false);
    router.refresh();
    if (newId) {
      toast.success("Account ready.");
      router.push(`/dashboard/trading?prop=${newId}`);
    } else {
      toast("Payment received — your account is still provisioning and will appear shortly.");
      router.push("/dashboard");
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <Card
            key={t.id}
            className={cn("flex flex-col", t.popular && "border-primary/40 shadow-glow")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.label}</CardTitle>
                {t.popular && (
                  <Badge>
                    <Sparkles className="size-3" /> Popular
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {t.amount_cents === 0 ? "Free" : `$${(t.amount_cents / 100).toFixed(0)}`}
                </span>
                {t.amount_cents > 0 && (
                  <span className="text-sm text-muted-foreground">one-time</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => pick(t)}
                loading={pending === t.id}
                variant={t.popular ? "default" : "outline"}
                className="w-full"
              >
                {t.amount_cents === 0 ? "Start free" : "Buy challenge"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog
        open={Boolean(clientSecret) || provisioning}
        onOpenChange={(o) => {
          // Don't allow closing while we're provisioning.
          if (!o && !provisioning) setClientSecret(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{provisioning ? "Provisioning your account" : "Complete your purchase"}</DialogTitle>
            <DialogDescription>
              {provisioning
                ? "Payment confirmed — setting up your trading account. This takes a few seconds."
                : "Securely pay with Stripe to provision your account."}
            </DialogDescription>
          </DialogHeader>
          {provisioning ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Almost there…</p>
            </div>
          ) : (
            clientSecret &&
            stripePromise && (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "night", labels: "floating" } }}
              >
                <PaymentForm onDone={waitForNewAccount} />
              </Elements>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
