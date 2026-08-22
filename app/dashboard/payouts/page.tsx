import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import * as hsc from "@/lib/hsc/client";

import { PayoutsClient } from "./PayoutsClient";

export default async function PayoutsPage() {
  // Don't collapse failures into empty arrays: "we couldn't load this" and
  // "you have nothing yet" render identically otherwise, and an unconfigured
  // tenant or a missing scope would look like a brand-new account.
  const [acctRes, payoutRes] = await Promise.allSettled([hsc.connect.list(), hsc.payouts.list()]);
  const accounts = acctRes.status === "fulfilled" ? acctRes.value : [];
  const payouts = payoutRes.status === "fulfilled" ? payoutRes.value : [];

  const rejected = [acctRes, payoutRes].find((r) => r.status === "rejected");
  const reason = rejected?.status === "rejected" ? rejected.reason : undefined;
  if (reason) console.error("[hsc] payouts page load failed:", reason);
  const loadError =
    reason instanceof hsc.HscApiError
      ? { code: reason.code, message: reason.message }
      : reason
        ? { code: "UNKNOWN", message: undefined }
        : undefined;

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Connect a bank account to receive your earned trading profit via Stripe."
        actions={<DocsLink href="/docs/payouts" />}
      />
      <PayoutsClient connectAccounts={accounts} payouts={payouts} loadError={loadError} />
    </div>
  );
}
