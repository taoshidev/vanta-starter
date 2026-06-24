"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createConnectAccountAction,
  getPayoutEstimateAction,
  refreshConnectLinkAction,
} from "@/app/actions/payouts";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { friendlyError } from "@/lib/errors";
import type { PayoutResponse } from "@/lib/hsc/client";

type ConnectAccount = {
  id: string;
  stripe_account_id: string;
  status: string | null;
  payouts_enabled: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
};

export function PayoutsClient({
  connectAccounts,
  payouts,
}: {
  connectAccounts: ConnectAccount[];
  payouts: PayoutResponse[];
}) {
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<{ amount_usd: number; available: boolean } | null>(null);
  const router = useRouter();

  useEffect(() => {
    getPayoutEstimateAction().then((r) => {
      if (r.ok && r.data) setEstimate(r.data);
    });
  }, []);

  // Stripe redirects back here after Connect onboarding with
  // ?onboarding=return (finished) or ?onboarding=refresh (link expired).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stage = params.get("onboarding");
    if (!stage) return;
    if (stage === "return") {
      toast.success("Stripe onboarding complete. Refreshing your account status…");
      router.refresh();
    } else if (stage === "refresh") {
      toast.error("That onboarding link expired. Click “Manage” to continue.");
    }
    // Strip the query so a manual refresh doesn't re-trigger the toast.
    window.history.replaceState(null, "", "/dashboard/payouts");
  }, [router]);

  async function link() {
    setBusy(true);
    const r = await createConnectAccountAction("US");
    setBusy(false);
    if (r.ok && r.data) {
      window.open(r.data.onboarding_url, "_blank", "noopener");
      toast.success("Opening Stripe onboarding in a new tab.");
    } else if (!r.ok) {
      toast.error(friendlyError(r.code, r.message));
    }
  }

  async function refresh(acct: string) {
    const r = await refreshConnectLinkAction(acct);
    if (r.ok && r.data) {
      window.open(r.data.onboarding_url, "_blank", "noopener");
    } else if (!r.ok) {
      toast.error(friendlyError(r.code, r.message));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Connected bank accounts</CardTitle>
            <CardDescription>Stripe Connect Express accounts for payouts.</CardDescription>
          </div>
          <Button size="sm" onClick={link} loading={busy}>
            <Plus /> Link account
          </Button>
        </CardHeader>
        <CardContent>
          {connectAccounts.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="No bank accounts linked"
              description="Link a Stripe Connect account to receive payouts."
            />
          ) : (
            <div className="space-y-3">
              {connectAccounts.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/40 p-4"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm">{a.stripe_account_id}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={a.status ?? "pending"} />
                      <span>Payouts {a.payouts_enabled ? "enabled" : "disabled"}</span>
                      <span>· Charges {a.charges_enabled ? "enabled" : "disabled"}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refresh(a.stripe_account_id)}>
                    <ExternalLink /> Manage
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimated payout</CardTitle>
          <CardDescription>Profit you&apos;ve earned from trading, owed to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-card/40 p-4">
            <div className="text-xs text-muted-foreground">Amount owed</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              {estimate
                ? `$${estimate.amount_usd.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "—"}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Payouts are calculated from your realized trading profit (high-water-mark)
            and paid out on the platform&apos;s schedule to your connected bank — there&apos;s
            nothing to request manually.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout history</CardTitle>
          <CardDescription>Your recent withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No payouts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      ${(p.amount_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.requested_at ? new Date(p.requested_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
