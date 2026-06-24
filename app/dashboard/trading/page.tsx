import { redirect } from "next/navigation";

import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import * as hsc from "@/lib/hsc/client";

import { TradingTerminal } from "./TradingTerminal";

type Props = { searchParams: Promise<{ prop?: string }> };

export default async function TradingPage({ searchParams }: Props) {
  const { prop } = await searchParams;
  const accounts = await hsc.payments.listPropAccounts().catch(() => []);
  if (accounts.length === 0) {
    redirect("/dashboard/checkout");
  }
  const selected = accounts.find((a) => a.id === prop) ?? accounts[0];
  return (
    <div>
      <PageHeader
        title="Trading terminal"
        description="Submit orders, manage positions, and track your fills in real time."
        actions={<DocsLink href="/docs/trading" />}
      />
      <TradingTerminal accounts={accounts} initialId={selected.id} />
    </div>
  );
}
