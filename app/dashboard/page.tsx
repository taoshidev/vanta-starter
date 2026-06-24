import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, Wallet } from "lucide-react";

import { DocsLink } from "@/components/docs/docs-link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as hsc from "@/lib/hsc/client";

export default async function DashboardHome() {
  const [me, kyc, accounts] = await Promise.all([
    hsc.auth.me(),
    hsc.kyc.status().catch(() => null),
    hsc.payments.listPropAccounts().catch(() => []),
  ]);

  const name = me.email.split("@")[0];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Your trading account at a glance."
        actions={
          <>
            <DocsLink href="/docs" label="Docs" />
            <Button asChild>
              <Link href="/dashboard/checkout">
                Buy a challenge <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Identity"
          value={<StatusBadge status={kyc?.kyc_status} />}
          icon={ShieldCheck}
          hint={
            kyc && kyc.kyc_status !== "verified" ? (
              <Link href="/dashboard/kyc" className="text-primary hover:underline">
                Complete verification →
              </Link>
            ) : (
              "You're verified and ready to trade."
            )
          }
        />
        <StatCard
          label="Prop accounts"
          value={accounts.length}
          icon={CreditCard}
          hint={
            <Link href="/dashboard/checkout" className="text-primary hover:underline">
              Add an account →
            </Link>
          }
        />
        <StatCard
          label="Account ID"
          value={<span className="font-mono text-sm">{me.user_id.slice(0, 8)}…</span>}
          icon={Wallet}
          hint="Your unique trader identifier."
        />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your prop accounts</h2>
        </div>
        {accounts.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No prop accounts yet"
            description="Buy a challenge or claim a free tier to start trading on live infrastructure."
            action={
              <Button asChild>
                <Link href="/dashboard/checkout">Browse challenges</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((a) => (
              <Card key={a.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{a.tier_id}</CardTitle>
                  <StatusBadge status={a.status} />
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {a.asset_class} · ${Number(a.account_size).toLocaleString()}
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/trading?prop=${a.id}`}>
                      Trade <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
