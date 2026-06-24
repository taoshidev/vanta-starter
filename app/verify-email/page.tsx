"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { resendOtpAction, verifyEmailAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { ErrorBanner, SubmitButton } from "@/components/Form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyError } from "@/lib/errors";

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function action(formData: FormData) {
    setError(null);
    formData.set("email", email);
    const result = await verifyEmailAction(formData);
    if (result.ok) {
      toast.success("Email verified");
      // Full navigation when a session was issued so the dashboard sees the
      // freshly-set cookie; otherwise a normal client nav to /login is fine.
      if (result.data?.session) window.location.assign("/dashboard");
      else router.push("/login");
    } else {
      setError(friendlyError(result.code, result.message));
    }
  }

  async function resend() {
    setError(null);
    setResending(true);
    const r = await resendOtpAction(email);
    setResending(false);
    if (r.ok) toast.success("Code resent — check your inbox.");
    else setError(friendlyError(r.code, r.message));
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email || "your email"}.`}
      footer={
        <>
          Wrong email?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Start over
          </Link>
        </>
      }
    >
      <ErrorBanner>{error}</ErrorBanner>
      <form action={action} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <div className="space-y-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            autoComplete="one-time-code"
            placeholder="••••••"
            className="text-center font-mono text-lg tracking-[0.5em]"
          />
        </div>
        <SubmitButton label="Verify email" pendingLabel="Verifying..." />
      </form>
      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="mt-4 text-sm font-medium text-primary hover:underline disabled:opacity-60"
      >
        {resending ? "Resending…" : "Resend code"}
      </button>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
