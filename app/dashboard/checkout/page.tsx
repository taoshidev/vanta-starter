import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";

import { CheckoutPicker } from "./CheckoutPicker";

export type Tier = {
  id: string;
  label: string;
  account_size: number;
  amount_cents: number;
  asset_class: string;
  popular?: boolean;
  features: string[];
};

const TIERS: Tier[] = [
  {
    id: "trial",
    label: "Free Trial",
    account_size: 10_000,
    amount_cents: 0,
    asset_class: "crypto",
    features: ["$10,000 simulated", "Crypto markets", "No card required"],
  },
  {
    id: "challenge_25k",
    label: "Challenge 25K",
    account_size: 25_000,
    amount_cents: 19900,
    asset_class: "crypto",
    features: ["$25,000 account", "Crypto markets", "Profit split on payout"],
  },
  {
    id: "challenge_50k",
    label: "Challenge 50K",
    account_size: 50_000,
    amount_cents: 34900,
    asset_class: "crypto",
    popular: true,
    features: ["$50,000 account", "Crypto markets", "Priority payouts"],
  },
  {
    id: "challenge_100k",
    label: "Challenge 100K",
    account_size: 100_000,
    amount_cents: 49900,
    asset_class: "crypto",
    features: ["$100,000 account", "Crypto markets", "Highest limits"],
  },
];

export default function CheckoutPage() {
  return (
    <div>
      <PageHeader
        title="Choose your challenge"
        description="Buy a funded challenge or start with a free trial account."
        actions={<DocsLink href="/docs/checkout" />}
      />
      <CheckoutPicker tiers={TIERS} />
    </div>
  );
}
