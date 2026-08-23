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
          Mint, list and revoke API-key records for your traders, optionally
          tagged with a single prop account.
        </p>
      </header>

      <Callout type="warning" title="These keys are a record only — they do not authenticate">
        The API does <strong>not</strong> yet accept an API key as a credential.
        There is no API-key authentication path: every <code>/v2</code> request,
        a trader&apos;s bot included, must still present your app&apos;s OAuth
        bearer token plus that user&apos;s <code>X-Session-Token</code>. A request
        carrying only a <code>key_id</code>/<code>key_secret</code> is rejected{" "}
        <code>401 V2_AUTH_MISSING</code>. <code>prop_account_id</code> is stored
        but enforced nowhere, and <code>last_used_at</code> is never written.
        Treat these endpoints as bookkeeping until key auth ships — do not build a
        bot-credential feature on them.
      </Callout>

      <DocSection title="Create a key">
        <Endpoint method="POST" path="/v2/api-keys" auth="user">
          <ParamTable
            title="Request body"
            rows={[
              { name: "label", type: "string", required: true, desc: "Human-readable name" },
              { name: "prop_account_id", type: "string", required: false, desc: "Recorded on the key row as a label. Not enforced anywhere" },
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
  "prop_account_id": "prop_..."
}`}
          />
          <Callout type="warning" title="The secret is shown once">
            Capture <code>key_secret</code> at creation time. It is hashed at rest
            and can never be retrieved again — rotate by revoking and re-creating.
          </Callout>
        </Endpoint>
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
