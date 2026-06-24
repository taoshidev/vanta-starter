"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signupAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { ErrorBanner, Field, SubmitButton } from "@/components/Form";
import { friendlyError } from "@/lib/errors";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function action(formData: FormData) {
    setError(null);
    const result = await signupAction(formData);
    if (result.ok) {
      const email = String(formData.get("email") ?? "");
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      setError(friendlyError(result.code, result.message));
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start onboarding in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
        <SubmitButton label="Create account" pendingLabel="Creating account..." />
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing you agree to the platform terms of service.
      </p>
    </AuthShell>
  );
}
