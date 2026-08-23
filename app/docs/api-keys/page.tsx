import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";

export const metadata = { title: "API keys" };

export default function ApiKeysDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Flows</p>
            <h1 className="text-3xl font-semibold tracking-tight">API keys</h1>
          </div>
          <DocsLink href="/dashboard/api-keys" label="Open in app" />
        </div>
        <p className="text-lg text-muted-foreground">
          Per-trader credentials for programmatic trading. A key authenticates a
          bot against the <code>/v2/trading</code> surface on its own — the
          trader never holds your app&apos;s OAuth client secret.
        </p>
      </header>

      <Callout type="info" title="How a key authenticates">
        Send <code>X-Api-Key: &lt;key_id&gt;.&lt;key_secret&gt;</code> (the mint
        response returns this composite string as <code>api_key</code>). No
        bearer token and no session token are needed alongside it. Keys work{" "}
        <strong>only</strong> on the trading surface — <code>/v2/trading</code>{" "}
        writes, reads and the SSE stream. Everything else — auth, payments,
        payouts, Connect, KYC, webhooks, notifications, and these key-management
        endpoints themselves — rejects a key with <code>401</code>, so a leaked
        key cannot mint more keys or touch anything tenant-level.
      </Callout>

      <Callout type="warning" title="Scopes and revocation">
        A key&apos;s effective scopes are your app&apos;s scopes intersected with{" "}
        <code>reads</code> + <code>trading</code> — it never inherits the{" "}
        <code>api</code> superscope, and payout initiation is unreachable.
        Revocation (and app deactivation) takes effect on the key&apos;s next
        request. A wrong or unknown credential returns{" "}
        <code>401 V2_API_KEY_INVALID</code>; a revoked one returns{" "}
        <code>401 V2_API_KEY_REVOKED</code>. <code>last_used_at</code> records the
        last <em>successful</em> use, stamped at most once a minute — the SSE
        stream is the one exception: it never stamps, so a stream-only bot can
        show <code>last_used_at: null</code>.
      </Callout>

      <DocSection title="Create a key">
        <Endpoint method="POST" path="/v2/api-keys" auth="user">
          <ParamTable
            title="Request body"
            rows={[
              { name: "label", type: "string", required: true, desc: "Human-readable name" },
              // Key management is session-only by design: a leaked key cannot mint more keys.
              { name: "prop_account_id", type: "string", required: false, desc: "Bind the key to one prop account you own (404 otherwise). A bound key trades and reads that account only" },
            ]}
          />
          <CodeBlock
            lang="json"
            filename="200 OK — secret shown once"
            code={`{
  "id": "key_...",
  "label": "Trading bot",
  "key_id": "hskk_A1b2C3d4",
  "key_secret": "opaque-random-string   // shown ONCE — store it now",
  "api_key": "hskk_A1b2C3d4.opaque-random-string   // send as X-Api-Key",
  "prop_account_id": "prop_..."
}`}
          />
          <Callout type="warning" title="The secret is shown once">
            Capture <code>key_secret</code> at creation time. It is hashed at rest
            and can never be retrieved again — rotate by revoking and re-creating.
          </Callout>
        </Endpoint>
      </DocSection>

      <DocSection title="Use the key" description="The bot calls the trading surface directly — no bearer, no session.">
        <CodeBlock
          lang="bash"
          filename="curl"
          code={`# Submit an order (trade_pair is the wire id — BTCUSD, not BTC/USD)
curl -X POST http://localhost:8000/v2/trading/orders \\
  -H "X-Api-Key: hskk_A1b2C3d4.opaque-random-string" \\
  -H "Content-Type: application/json" \\
  -d '{ "trade_pair": "BTCUSD", "order_type": "LONG", "leverage": 0.1 }'

# Read the desk
curl http://localhost:8000/v2/trading/desk-poll \\
  -H "X-Api-Key: hskk_A1b2C3d4.opaque-random-string"`}
        />
        <Callout type="info" title="Prop-account binding">
          An unbound key resolves accounts like a session does:{" "}
          <code>X-Prop-Account</code> selects one, otherwise the most-recent is
          used. A key minted with <code>prop_account_id</code> is pinned — an
          omitted header resolves to the bound account (not the most-recent), the
          header may restate it, and naming any other account is refused with{" "}
          <code>403 V2_API_KEY_ACCOUNT_MISMATCH</code> rather than silently
          redirected.
        </Callout>
      </DocSection>

      <DocSection title="List keys">
        <Endpoint method="GET" path="/v2/api-keys" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`[
  { "id": "key_...", "label": "Trading bot", "key_id": "hskk_A1b2C3d4", "revoked_at": null }
]`}
          />
          <ApiTester operation="apiKeys.list" method="GET" path="/v2/api-keys" />
        </Endpoint>
      </DocSection>

      <DocSection title="Revoke a key">
        <Endpoint method="DELETE" path="/v2/api-keys/{id}" auth="user">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X DELETE http://localhost:8000/v2/api-keys/key_... \\
  -H "Authorization: Bearer <app_access_token>" \\
  -H "X-Session-Token: <user_session_token>"`}
          />
          <CodeBlock lang="json" filename="200 OK" code={`{ "revoked": true }`} />
        </Endpoint>
      </DocSection>
    </>
  );
}
