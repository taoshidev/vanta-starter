import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";

export const metadata = { title: "Checkout & accounts" };

export default function CheckoutDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Flows</p>
            <h1 className="text-3xl font-semibold tracking-tight">Checkout &amp; accounts</h1>
          </div>
          <DocsLink href="/dashboard/checkout" label="Open in app" />
        </div>
        <p className="text-lg text-muted-foreground">
          Sell prop-trading challenges with Stripe. Create a PaymentIntent,
          collect payment with Stripe Elements, and a funded prop account is
          provisioned automatically when the payment succeeds.
        </p>
      </header>

      <DocSection title="How it works">
        <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
          <li>Call <code>POST /v2/payments/checkout</code> to create a PaymentIntent.</li>
          <li>Confirm payment in the browser with the returned <code>client_secret</code> + Stripe Elements.</li>
          <li>Stripe fires <code>payment_intent.succeeded</code> → the API provisions a prop account.</li>
          <li>Poll <code>GET /v2/payments/prop-accounts</code> until the new account appears.</li>
        </ol>
        <Callout type="warning" title="Provisioning is async">
          The account is created by the webhook, not the checkout call. Poll
          (this app waits up to ~30s) or listen for the <code>payment.succeeded</code>{" "}
          webhook before redirecting the user.
        </Callout>
      </DocSection>

      <DocSection title="Create a checkout (PaymentIntent)">
        <Endpoint method="POST" path="/v2/payments/checkout" auth="user">
          <ParamTable
            title="Request body"
            rows={[
              { name: "tier_id", type: "string", required: true, desc: "Challenge tier identifier" },
              { name: "market", type: "string", required: true, desc: 'e.g. "crypto"' },
              { name: "asset_class", type: "string", required: true, desc: 'e.g. "crypto" / "forex"' },
              { name: "account_size", type: "number", required: true, desc: "Funded account size in USD" },
              { name: "amount_cents", type: "number", required: true, desc: "Price charged, in cents" },
              { name: "currency", type: "string", required: false, desc: 'Defaults to "usd"' },
            ]}
          />
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:8000/v2/payments/checkout \\
  -H "Authorization: Bearer <app_access_token>" \\
  -H "X-Session-Token: <user_session_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tier_id": "tier_25k",
    "market": "crypto",
    "asset_class": "crypto",
    "account_size": 25000,
    "amount_cents": 19900,
    "currency": "usd"
  }'`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "payment_id": "pay_...",
  "stripe_payment_intent_id": "pi_...",
  "client_secret": "pi_..._secret_...",
  "amount_cents": 19900,
  "currency": "usd",
  "status": "requires_payment_method"
}`}
          />
          <CodeBlock
            lang="typescript"
            filename="confirm in the browser"
            code={`import { loadStripe } from "@stripe/stripe-js";

const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
// render <Elements options={{ clientSecret }}> with <PaymentElement />, then:
await stripe.confirmPayment({ elements, redirect: "if_required" });`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="Create a free account" description="Provision a no-charge account (e.g. for demos or comped traders) without Stripe.">
        <Endpoint method="POST" path="/v2/payments/free" auth="user">
          <CodeBlock
            lang="json"
            filename="Request body"
            code={`{ "tier_id": "tier_demo", "asset_class": "crypto", "account_size": 10000 }`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK — provisioned"
            code={`{
  "id": "prop_...",
  "status": "evaluation",
  "subaccount_id": 42,
  "subaccount_uuid": "9c1...",
  "synthetic_hotkey": "5F..."
}`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK — NOT provisioned"
            code={`{
  "id": "prop_...",
  "status": "subaccount_failed",
  "subaccount_id": null,
  "subaccount_uuid": null,
  "synthetic_hotkey": null
}`}
          />
        </Endpoint>
        <Callout type="warning" title="200 does not mean provisioned">
          This endpoint returns <code>200</code> with a prop-account body in{" "}
          <strong>both</strong> the success and the failure case, so you must
          branch on the response <code>status</code> rather than on the HTTP code.
          A <code>subaccount_failed</code> account has{" "}
          <code>subaccount_id</code>, <code>subaccount_uuid</code> and{" "}
          <code>synthetic_hotkey</code> set to <code>null</code> and can never
          trade — every <code>/v2/trading/*</code> call, reads included, returns{" "}
          <code>409 V2_SUBACCOUNT_NOT_READY</code>, because the read routes
          resolve the prop account through the same guard as the writes. The
          API answers 200 rather than 5xx on purpose: raising would roll back the
          request session and destroy the row that records the attempt. Do not
          auto-retry — surface the account for operator recovery via{" "}
          <code>GET /v2/payments/prop-accounts/failed</code>.
        </Callout>
      </DocSection>

      <DocSection title="List prop accounts" description="status is one of: provisioning (subaccount create in flight), evaluation (provisioned and tradeable), funded, eliminated (both set by POST /v2/lifecycle/sync/{prop_account_id}), and subaccount_failed (charged but not provisioned). It is never “active” — gate your trading entry point on evaluation or funded.">
        <Endpoint method="GET" path="/v2/payments/prop-accounts" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`[
  {
    "id": "prop_...",
    "tier_id": "tier_25k",
    "asset_class": "crypto",
    "account_size": 25000,
    "status": "evaluation",
    "subaccount_id": 42,
    "subaccount_uuid": "9c1...",
    "synthetic_hotkey": "5F...",
    "stripe_payment_intent_id": "pi_..."
  }
]`}
          />
          <ApiTester
            operation="payments.listPropAccounts"
            method="GET"
            path="/v2/payments/prop-accounts"
          />
        </Endpoint>
        <p className="text-sm text-muted-foreground">
          Fetch one by id with <code>GET /v2/payments/prop-accounts/{`{id}`}</code>.
        </p>
      </DocSection>
    </>
  );
}
