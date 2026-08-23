import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";

export const metadata = { title: "Authentication" };

const ADMIN_URL = `${
  process.env.NEXT_PUBLIC_HSC_API_BASE_URL ?? "http://localhost:8000"
}/admin`;

export default function AuthDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Getting started</p>
            <h1 className="text-3xl font-semibold tracking-tight">Authentication</h1>
          </div>
          <DocsLink href="/login" label="Try it" />
        </div>
        <p className="text-lg text-muted-foreground">
          Two layers: your <strong>app</strong> authenticates with OAuth client
          credentials; your <strong>end users</strong> authenticate with email +
          password (and optional TOTP) and carry a session token.
        </p>
      </header>

      <DocSection title="Get your credentials" description="Before any token exchange you need a client_id and client_secret. Request access, and once an operator approves you'll get a one-time link to retrieve them.">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Submit the <strong>Request access</strong> form with your company,
            contact email, and intended use.
          </li>
          <li>
            An operator provisions your network identity and{" "}
            <strong>approves</strong> the request (manual review).
          </li>
          <li>
            You receive an email with a <strong>one-time link</strong> that
            reveals your <code>client_id</code> and <code>client_secret</code>{" "}
            — the secret is displayed <strong>once</strong>, so store it in your
            secret manager.
          </li>
          <li>
            Put them in this app&apos;s env as <code>HSC_CLIENT_ID</code> and{" "}
            <code>HSC_CLIENT_SECRET</code> (see{" "}
            <Link href="/docs/quickstart">Quickstart</Link>).
          </li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/request-access"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Request access
          </Link>
          <a
            href={ADMIN_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-card"
          >
            Admin console (operators) <ArrowUpRight className="size-3.5" />
          </a>
        </div>
        <Callout type="info" title="Why approval is manual">
          Each tenant maps to a vanta-network <code>entity_hotkey</code> that is
          minted out-of-band on Bittensor. We provision that first, then approve
          your request and issue OAuth credentials scoped to your tenant.
        </Callout>
        <Endpoint method="GET" path="/v2/apps/me" auth="app">
          <p className="text-sm text-muted-foreground">
            Confirm which tenant a key resolves to and which scopes it has. The
            secret is never returned — rotate it in the admin console if lost.
          </p>
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "app_id": "app_...",
  "slug": "company-a",
  "name": "Company A",
  "entity_hotkey": "5ABC...",
  "allowed_scopes": ["api"],
  "active": true
}`}
          />
          <ApiTester operation="apps.me" method="GET" path="/v2/apps/me" />
        </Endpoint>
      </DocSection>

      <DocSection title="App token (OAuth client credentials)" description="Exchange your client_id/client_secret for a short-lived bearer token. The body is form-encoded (application/x-www-form-urlencoded), per RFC 6749 — a JSON body is rejected with 422. Do this server-side only — never expose the secret to the browser.">
        <Endpoint method="POST" path="/v2/oauth/token" auth="public">
          <ParamTable
            title="Form fields"
            rows={[
              { name: "grant_type", type: "string", required: true, desc: '"client_credentials"' },
              { name: "client_id", type: "string", required: true, desc: "Your app's client id (hsc_…)" },
              { name: "client_secret", type: "string", required: true, desc: "Your app's secret (hsk_…)" },
              { name: "scope", type: "string", required: false, desc: "Space-separated. Omit to receive every scope your app holds. Scopes your app lacks are silently dropped from the grant \u2014 400 V2_INVALID_SCOPE comes back only when none of the requested scopes is allowed. Read the scope field of the token response to see what was actually granted" },
            ]}
          />
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:8000/v2/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d grant_type=client_credentials \\
  -d client_id=hsc_... \\
  -d client_secret=hsk_... \\
  -d scope=api`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "access_token": "eyJhbGciOiJI...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api"
}`}
          />
        </Endpoint>
        <Callout type="warning" title="Server-side only">
          The client secret must never reach the browser. In this app all calls
          flow through <code>lib/hsc/client.ts</code> on the server, which caches
          the token automatically.
        </Callout>
      </DocSection>

      <DocSection title="Programmatic trading keys" description="A third credential exists for one surface only: per-trader API keys authenticate /v2/trading (writes, reads, SSE) on their own via the X-Api-Key header, so a trader's bot never holds your client secret. Everything else on this page is unchanged for keys — they cannot reach any other endpoint. See the API keys page for minting, binding and revocation.">
        <p className="text-sm text-muted-foreground">
          Details and examples: <a href="/docs/api-keys">/docs/api-keys</a>.
        </p>
      </DocSection>

      <DocSection title="End-user sessions" description="Once your app is authenticated, you create and authenticate the people who use it. A successful signup verification or login returns a session_token to send as X-Session-Token on subsequent calls.">
        <Endpoint method="POST" path="/v2/auth/signup" auth="app">
          <CodeBlock
            lang="json"
            filename="Request body"
            code={`{ "email": "trader@example.com", "password": "correct horse battery staple" }`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "user_id": "usr_...",
  "email": "trader@example.com",
  "email_verified": false,
  "otp_sent": true
}`}
          />
        </Endpoint>

        <Endpoint method="POST" path="/v2/auth/verify-email" auth="app">
          <CodeBlock
            lang="json"
            filename="Request body"
            code={`{ "email": "trader@example.com", "code": "123456" }`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "user_id": "usr_...",
  "email": "trader@example.com",
  "email_verified": true,
  "session_token": "sess_...",
  "session_expires_at": "2026-06-29T00:00:00Z"
}`}
          />
        </Endpoint>

        <Endpoint method="POST" path="/v2/auth/login" auth="app">
          <ParamTable
            title="Request body"
            rows={[
              { name: "email", type: "string", required: true, desc: "User email" },
              { name: "password", type: "string", required: true, desc: "User password" },
              { name: "totp_code", type: "string", required: false, desc: "6-digit TOTP if MFA is enabled" },
            ]}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "user_id": "usr_...",
  "email": "trader@example.com",
  "session_token": "sess_...",
  "session_expires_at": "2026-06-29T00:00:00Z",
  "mfa_required": false
}`}
          />
        </Endpoint>

        <p className="text-sm text-muted-foreground">
          Other endpoints in this group:{" "}
          <code>POST /v2/auth/resend-otp</code>,{" "}
          <code>POST /v2/auth/password-reset/request</code>,{" "}
          <code>POST /v2/auth/password-reset/confirm</code>,{" "}
          <code>POST /v2/auth/sessions/revoke</code> (logout).
        </p>
      </DocSection>

      <DocSection title="Who am I?" description="Verify a session and resolve the current user. Pass both the app bearer token and the user's X-Session-Token.">
        <Endpoint method="GET" path="/v2/auth/me" auth="user">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl http://localhost:8000/v2/auth/me \\
  -H "Authorization: Bearer <app_access_token>" \\
  -H "X-Session-Token: <user_session_token>"`}
          />
          <CodeBlock
            lang="typescript"
            filename="lib/hsc/client.ts"
            code={`import { auth } from "@/lib/hsc/client";

const me = await auth.me();
// { user_id: "usr_...", email: "...", app_id: "app_..." }`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{ "user_id": "usr_...", "email": "trader@example.com", "app_id": "app_..." }`}
          />
          <ApiTester operation="auth.me" method="GET" path="/v2/auth/me" />
        </Endpoint>
      </DocSection>

      <Callout type="tip" title="Full API reference">
        Every endpoint, schema, and error code is documented in the live Swagger
        UI at <code>/docs</code> on the API. See also the{" "}
        <Link href="/docs/quickstart">Quickstart</Link>.
      </Callout>
    </>
  );
}
