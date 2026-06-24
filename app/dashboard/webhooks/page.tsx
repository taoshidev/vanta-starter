import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Webhook } from "lucide-react";
import * as hsc from "@/lib/hsc/client";

import { WebhooksClient } from "./WebhooksClient";

export default async function WebhooksPage() {
  const endpoints = await hsc.webhooks.list().catch(() => []);
  return (
    <div>
      <PageHeader
        title="Webhooks"
        description="Receive signed, real-time event notifications from hyperscaled-api."
        actions={<DocsLink href="/docs/webhooks" />}
      />
      <Alert className="mb-6">
        <Webhook />
        <AlertTitle>Example consumer included</AlertTitle>
        <AlertDescription>
          This starter ships a verified consumer at{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">POST /api/hsc-webhook</code>{" "}
          that validates the{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">X-Hyperscaled-Signature</code>{" "}
          header.
        </AlertDescription>
      </Alert>
      <WebhooksClient endpoints={endpoints} />
    </div>
  );
}
