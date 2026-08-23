import { CodeBlock } from "@/components/docs/code-block";
import { Callout, DocSection, Endpoint } from "@/components/docs/blocks";

export const metadata = { title: "Lifecycle" };

export default function LifecycleDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Flows</p>
        <h1 className="text-3xl font-semibold tracking-tight">Account lifecycle</h1>
        <p className="text-lg text-muted-foreground">
          A prop account has five partner-visible states. Provisioning comes
          first — <code>provisioning</code> (row created, subaccount not yet
          confirmed) and <code>subaccount_failed</code> (the entity-miner call
          raised; the customer may already have been charged). Only once a
          subaccount exists does the trading cycle apply:
          <code> evaluation</code> → <code>funded</code> → <code>eliminated</code>.
          Sync the latest state from the validator on demand.
        </p>
      </header>

      <DocSection title="Sync status">
        <Endpoint method="POST" path="/v2/lifecycle/sync/{prop_account_id}" auth="user">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:8000/v2/lifecycle/sync/prop_123 \\
  -H "Authorization: Bearer <app_access_token>" \\
  -H "X-Session-Token: <user_session_token>"`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "prop_account_id": "prop_123",
  "status": "funded",
  "subaccount_id": 42,
  "synthetic_hotkey": "5F..."
}`}
          />
        </Endpoint>
      </DocSection>

      <Callout type="warning" title="Nothing updates status but this call">
        There is no passive update path. <code>status</code> changes only when you
        call <code>POST /v2/lifecycle/sync/{"{prop_account_id}"}</code>, once per
        account — nothing in the API updates it in the background, and there is no
        lifecycle webhook to subscribe to (the only events are{" "}
        <code>payment.succeeded</code>, <code>payment.failed</code>,{" "}
        <code>kyc.updated</code>, <code>payout.completed</code> and{" "}
        <code>payout.failed</code>). Schedule this yourself for every active prop
        account — after a trading session and on a recurring timer — or promotions
        and eliminations will never appear in your UI. The call is best-effort: if
        the validator lookup fails it returns <code>200</code> with the previous,
        unchanged status.
      </Callout>

      <Callout type="info" title="Sync only converges for provisioned accounts">
        Sync writes only the three trading states, and only for accounts that
        already have a <code>synthetic_hotkey</code>. Called on a{" "}
        <code>provisioning</code> or <code>subaccount_failed</code> account it
        returns <code>200</code> with that status unchanged and will never
        converge — branch on those two states instead of polling. Recover
        charged-but-unprovisioned accounts through{" "}
        <code>GET /v2/payments/prop-accounts/failed</code>.
      </Callout>
    </>
  );
}
