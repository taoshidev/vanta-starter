"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";

import { requestAccessAction } from "@/app/actions/app-requests";
import { AuthShell } from "@/components/auth-shell";
import { ErrorBanner, Field, SubmitButton } from "@/components/Form";
import { Label } from "@/components/ui/label";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";

export default function RequestAccessPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ email: string } | null>(null);

  async function action(formData: FormData) {
    setError(null);
    const result = await requestAccessAction(formData);
    if (result.ok) {
      setSubmitted({ email: String(formData.get("contact_email") ?? "") });
    } else {
      setError(friendlyError(result.code, result.message));
    }
  }

  if (submitted) {
    return (
      <AuthShell
        title="Request received"
        subtitle="We'll review it shortly."
        footer={
          <Link href="/" className="font-medium text-primary hover:underline">
            Back to home
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Thanks! Once an operator approves your request, we&apos;ll email{" "}
            <span className="font-medium text-foreground">{submitted.email}</span> a
            one-time link to retrieve your <code>client_id</code> and{" "}
            <code>client_secret</code>.
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 text-xs text-muted-foreground">
            <Mail className="size-3.5" /> Check your inbox (and spam) for updates.
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Request API access"
      subtitle="Tell us about your app — we'll review and send your credentials."
      footer={
        <>
          Already have credentials?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <ErrorBanner>{error}</ErrorBanner>
      <form action={action} className="space-y-4">
        <Field
          label="Company / app name"
          name="company_name"
          placeholder="Acme Markets"
          autoComplete="organization"
          maxLength={255}
          required
        />
        <Field
          label="Desired slug"
          name="slug"
          hint="lowercase, a–z 0–9 -"
          placeholder="acme-markets"
          pattern="[a-z0-9][a-z0-9-]*"
          maxLength={64}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Your name"
            name="contact_name"
            placeholder="Jane Doe"
            autoComplete="name"
            maxLength={255}
          />
          <Field
            label="Work email"
            name="contact_email"
            type="email"
            placeholder="you@acme.com"
            autoComplete="email"
            required
          />
        </div>
        <Field
          label="Website"
          name="website"
          type="url"
          placeholder="https://acme.com"
          maxLength={512}
        />
        <div className="space-y-1.5">
          <Label htmlFor="use_case">What are you building?</Label>
          <textarea
            id="use_case"
            name="use_case"
            rows={4}
            maxLength={4000}
            placeholder="A short description of your prop-trading product and expected volume."
            className={cn(
              "flex min-h-[96px] w-full rounded-lg border border-input bg-background/40 px-3 py-2 text-sm shadow-sm transition-colors",
              "placeholder:text-muted-foreground/70",
              "focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            )}
          />
        </div>
        <SubmitButton label="Request access" pendingLabel="Submitting..." />
      </form>
    </AuthShell>
  );
}
