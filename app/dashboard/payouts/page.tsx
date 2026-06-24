import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import * as hsc from "@/lib/hsc/client";

import { PayoutsClient } from "./PayoutsClient";

export default async function PayoutsPage() {
  const [accounts, payouts] = await Promise.all([
    hsc.connect.list().catch(() => []),
    hsc.payouts.list().catch(() => []),
  ]);
  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Connect a bank account to receive your earned trading profit via Stripe."
        actions={<DocsLink href="/docs/payouts" />}
      />
      <PayoutsClient connectAccounts={accounts} payouts={payouts} />
    </div>
  );
}
