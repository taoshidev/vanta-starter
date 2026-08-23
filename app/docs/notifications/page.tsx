import { CodeBlock } from "@/components/docs/code-block";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";

export const metadata = { title: "Notifications" };

export default function NotificationsDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Flows</p>
        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-lg text-muted-foreground">
          Send transactional email to your users and optionally fan the same
          event out to your registered webhook endpoints — one call, two
          channels.
        </p>
      </header>

      <DocSection title="Send a notification">
        <Endpoint method="POST" path="/v2/notifications/send" auth="app">
          <ParamTable
            title="Request body"
            rows={[
              { name: "user_id", type: "string", required: false, desc: "Authorizes the call against one of your users and stamps user_id into the fan-out payload. Does NOT send email on its own" },
              { name: "email", type: "string", required: false, desc: "Recipient selector — the only field that triggers email. Must match one of your app's users (matched on the normalized address); mail goes to that user's stored address" },
              { name: "subject", type: "string", required: true, desc: "Email subject" },
              { name: "html", type: "string", required: true, desc: "HTML body" },
              { name: "text", type: "string", required: false, desc: "Plain-text fallback" },
              { name: "fanout_event", type: "string", required: false, desc: "Webhook event type to emit — use one of the five canonical events, since those plus \"*\" are the only values a webhook endpoint can subscribe to" },
              { name: "payload", type: "object", required: false, desc: "Data for the webhook event" },
            ]}
          />
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:8000/v2/notifications/send \\
  -H "Authorization: Bearer <app_access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "trader@example.com",
    "subject": "Your account is funded",
    "html": "<h1>Congrats!</h1><p>You are now funded.</p>",
    "fanout_event": "kyc.updated",
    "payload": { "prop_account_id": "prop_123" }
  }'`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{ "email_sent": true, "webhook_deliveries_queued": 2 }`}
          />
        </Endpoint>
      </DocSection>

      <Callout type="warning" title="Only email sends mail">
        <code>email</code> is the only field that delivers a message.{" "}
        <code>user_id</code> does <strong>not</strong> resolve to an address — it
        authorizes the target user and populates <code>user_id</code> in the
        fan-out payload, so a request carrying <code>user_id</code> but no{" "}
        <code>email</code> returns <code>200</code> with{" "}
        <code>{`{ "email_sent": false }`}</code> and sends nothing. To email a user
        you only know by id, look up their address first and pass it as{" "}
        <code>email</code>.
      </Callout>

      <Callout type="warning" title="You can only email your own users">
        The address must belong to a user of your app, or the call fails{" "}
        <code>403 V2_NOTIFY_RECIPIENT_FORBIDDEN</code> — prospects, support
        aliases and internal QA inboxes are all rejected. Delivery goes to the
        address stored on the user record, so the <code>To:</code> may differ from
        what you sent. Supply at least one of <code>email</code>,{" "}
        <code>user_id</code> or <code>fanout_event</code>, or the request is
        rejected <code>422 V2_NOTIFY_EMPTY</code>.
      </Callout>

      <Callout type="tip" title="fanout_event is not validated">
        The five canonical events are <code>payment.succeeded</code>,{" "}
        <code>payment.failed</code>, <code>kyc.updated</code>,{" "}
        <code>payout.completed</code> and <code>payout.failed</code>. This endpoint
        accepts any string, but fan-out matches an endpoint only on an exact name
        or a <code>[&quot;*&quot;]</code> subscription — so an unregistered name
        returns <code>200</code> with{" "}
        <code>&quot;webhook_deliveries_queued&quot;: 0</code>, and trying to
        subscribe to it via <a href="/docs/webhooks">/v2/webhook-endpoints</a>{" "}
        fails <code>422 V2_WEBHOOK_UNKNOWN_EVENT</code>.
      </Callout>
    </>
  );
}
