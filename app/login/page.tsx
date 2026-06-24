"use client";

import Link from "next/link";
import { useState } from "react";

import { loginAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { ErrorBanner, Field, SubmitButton } from "@/components/Form";
import { friendlyError } from "@/lib/errors";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [needsTotp, setNeedsTotp] = useState(false);

  async function action(formData: FormData) {
    setError(null);
    const result = await loginAction(formData);
    if (result.ok) {
      if (result.data?.mfa_required) setNeedsTotp(true);
      // Full navigation so the dashboard server components see the session
      // cookie that was just set (a client router.push would reuse the cached
      // logged-out RSC payload and bounce back to /login).
      else window.location.assign("/dashboard");
    } else {
      setError(friendlyError(result.code, result.message));
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your trading dashboard."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <ErrorBanner>{error}</ErrorBanner>
      <form action={action} className="space-y-4">
        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          hint=""
          required
        />
        {needsTotp && (
          <Field
            label="Two-factor code"
            name="totp_code"
            inputMode="numeric"
            placeholder="123456"
            autoComplete="one-time-code"
            required
          />
        )}
        <SubmitButton label="Sign in" pendingLabel="Signing in..." />
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/reset-password" className="text-muted-foreground hover:text-foreground hover:underline">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Building an app on the API?{" "}
        <Link href="/request-access" className="text-primary hover:underline">
          Request access
        </Link>
      </p>
    </AuthShell>
  );
}
