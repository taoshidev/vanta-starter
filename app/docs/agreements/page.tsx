import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";

export const metadata = { title: "Agreements" };

export default function AgreementsDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Flows</p>
        <h1 className="text-3xl font-semibold tracking-tight">Agreements</h1>
        <p className="text-lg text-muted-foreground">
          Capture and audit a trader&apos;s acceptance of your terms — trading
          agreements, risk disclosures, or payout policies — with an immutable
          signature trail.
        </p>
      </header>

      <DocSection title="Sign an agreement">
        <Endpoint method="POST" path="/v2/agreements/sign" auth="user">
          <ParamTable
            title="Request body"
            rows={[
              { name: "agreement_version", type: "string", required: true, desc: "Version the user accepted" },
              { name: "signature_name", type: "string", required: true, desc: "Typed legal name" },
              { name: "document_url", type: "string", required: false, desc: "Link to the signed document" },
              { name: "document_sha256", type: "string", required: false, desc: "Hash of the document bytes" },
            ]}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{ "signed": true, "signed_at": "2026-06-22T18:04:11Z", "agreement_version": "2026-06-01" }`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="Check status">
        <Endpoint method="GET" path="/v2/agreements/status" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{ "signed": true, "signed_at": "2026-06-22T18:04:11Z", "agreement_version": "2026-06-01" }`}
          />
          <ApiTester operation="agreements.status" method="GET" path="/v2/agreements/status" />
        </Endpoint>
      </DocSection>

      <DocSection title="Audit history" description="Every signature is retained for compliance.">
        <Endpoint method="GET" path="/v2/agreements/audits" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`[
  {
    "id": "agr_...",
    "agreement_version": "2026-06-01",
    "signature_name": "Ada Lovelace",
    "signed_at": "2026-06-22T18:04:11Z",
    "document_url": "https://yourapp.com/terms-2026-06-01.pdf"
  }
]`}
          />
          <ApiTester operation="agreements.audits" method="GET" path="/v2/agreements/audits" />
        </Endpoint>
      </DocSection>

      <Callout type="tip" title="Gate trading on acceptance">
        Check <code>signed</code> before allowing a user to fund or trade, and
        re-prompt whenever you publish a new <code>agreement_version</code>.
      </Callout>
    </>
  );
}
