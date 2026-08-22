import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";

export const metadata = { title: "Webhooks" };

export default function WebhooksDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Flows</p>
            <h1 className="text-3xl font-semibold tracking-tight">Webhooks</h1>
          </div>
          <DocsLink href="/dashboard/webhooks" label="Open in app" />
        </div>
        <p className="text-lg text-muted-foreground">
          Receive real-time events instead of polling. Register an HTTPS endpoint,
          subscribe to the events you care about, and verify the signature on
          every delivery.
        </p>
      </header>

      <DocSection title="Available events">
        <ParamTable
          rows={[
            { name: "payment.succeeded", type: "event", desc: "A checkout payment cleared; an account is being provisioned" },
            { name: "payment.failed", type: "event", desc: "A checkout payment failed" },
            { name: "kyc.updated", type: "event", desc: "A trader's KYC status changed" },
            { name: "payout.completed", type: "event", desc: "A payout settled to the trader's Connect account" },
            { name: "payout.failed", type: "event", desc: "A payout was reversed or could not be settled" },
            { name: "*", type: "wildcard", desc: "Subscribe to every event type" },
          ]}
        />
      </DocSection>

      <DocSection title="Register an endpoint">
        <Endpoint method="POST" path="/v2/webhook-endpoints" auth="user">
          <ParamTable
            title="Request body"
            rows={[
              { name: "url", type: "string", required: true, desc: "Your HTTPS receiver" },
              { name: "events", type: "string[]", required: true, desc: 'e.g. ["payment.succeeded","kyc.updated"] or ["*"]' },
              { name: "description", type: "string", required: false, desc: "Internal label" },
            ]}
          />
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:8000/v2/webhook-endpoints \\
  -H "Authorization: Bearer <app_access_token>" \\
  -H "X-Session-Token: <user_session_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.com/api/webhooks",
    "events": ["payment.succeeded", "kyc.updated"],
    "description": "Production receiver"
  }'`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK — secret shown once"
            code={`{
  "id": "whe_...",
  "url": "https://yourapp.com/api/webhooks",
  "events": ["payment.succeeded", "kyc.updated"],
  "active": true,
  "description": "Production receiver",
  "secret": "whsec_...   // store it — used to verify signatures"
}`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="Delivery format" description="Each delivery is a POST with a JSON envelope and signed headers.">
        <CodeBlock
          lang="http"
          filename="POST https://yourapp.com/api/webhooks"
          code={`Content-Type: application/json
X-Hyperscaled-Event: payment.succeeded
X-Hyperscaled-Delivery: whd_...
X-Hyperscaled-Timestamp: 1750640000
X-Hyperscaled-Signature: t=1750640000,v1=9f86d081...

{
  "type": "payment.succeeded",
  "data": { "payment_id": "pay_...", "user_id": "usr_...", "stripe_payment_intent_id": "pi_..." },
  "timestamp": "2026-06-22T23:13:20+00:00"
}`}
        />
      </DocSection>

      <DocSection title="Verify the signature" description="HMAC-SHA256 over `{timestamp}.{raw_body}` using your endpoint secret. Reject deliveries older than ~5 minutes.">
        <CodeBlock
          lang="typescript"
          filename="app/api/hsc-webhook/route.ts"
          code={`import crypto from "node:crypto";

// Accepts one secret or a comma-separated list, so you can keep the old and
// new secret live at the same time while rotating.
const SECRETS = (process.env.HSC_WEBHOOK_SECRET ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

export async function POST(req: Request) {
  const raw = await req.text();
  const header = req.headers.get("x-hyperscaled-signature") ?? "";

  // The header may carry SEVERAL v1= signatures during a secret rotation:
  //   t=1730000000,v1=<new>,v1=<previous>
  // Object.fromEntries would silently keep only the last one — collect them all.
  let ts = NaN;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") ts = Number(value);
    else if (key === "v1") signatures.push(value);
  }
  if (!Number.isFinite(ts) || signatures.length === 0) {
    return new Response("bad signature", { status: 400 });
  }

  // Reject stale deliveries (replay protection).
  if (Math.abs(Date.now() / 1000 - ts) > 300) return new Response("stale", { status: 400 });

  const ok = SECRETS.some((secret) => {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(\`\${ts}.\${raw}\`)
      .digest("hex");
    // timingSafeEqual throws on a length mismatch — guard before comparing.
    return signatures.some(
      (sig) =>
        sig.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)),
    );
  });
  if (!ok) return new Response("bad signature", { status: 400 });

  const event = JSON.parse(raw); // { type, data, timestamp }
  // ...handle event.type
  return new Response("ok");
}`}
        />
        <Callout type="warning" title="Handle multiple signatures">
          During a secret rotation the platform signs each delivery with every
          currently-active secret and sends one <code>v1=</code> per secret.
          A verifier that parses the header into an object keeps only the last
          one and will reject <em>every</em> delivery for the whole grace
          window. Accept the delivery if <em>any</em> signature matches.
        </Callout>
        <Callout type="tip" title="This app ships a receiver">
          See <code>app/api/hsc-webhook/route.ts</code> in this repo for a
          working verifier wired to <code>HSC_WEBHOOK_SECRET</code>.
        </Callout>
      </DocSection>

      <DocSection title="List & remove endpoints">
        <Endpoint method="GET" path="/v2/webhook-endpoints" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`[
  {
    "id": "whe_...",
    "url": "https://yourapp.com/api/webhooks",
    "events": ["payment.succeeded", "kyc.updated"],
    "active": true,
    "description": "Production receiver"
  }
]`}
          />
          <ApiTester operation="webhooks.list" method="GET" path="/v2/webhook-endpoints" />
        </Endpoint>
        <p className="text-sm text-muted-foreground">
          Deactivate with <code>DELETE /v2/webhook-endpoints/{`{id}`}</code>.
        </p>
      </DocSection>
    </>
  );
}
