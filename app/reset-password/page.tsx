"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { confirmPasswordResetAction, requestPasswordResetAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { ErrorBanner, Field, InfoBanner, SubmitButton } from "@/components/Form";
import { friendlyError } from "@/lib/errors";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function request(formData: FormData) {
    setError(null);
    setInfo(null);
    const e = String(formData.get("email") ?? "");
    const r = await requestPasswordResetAction(e);
    if (r.ok) {
      setEmail(e);
      setStage("confirm");
      setInfo("If an account exists for that email, a reset token is on its way.");
    } else {
      setError(friendlyError(r.code, r.message));
    }
  }

  async function confirm(formData: FormData) {
    setError(null);
    formData.set("email", email);
    const r = await confirmPasswordResetAction(formData);
    if (r.ok) {
      toast.success("Password updated — sign in with your new password.");
      router.push("/login");
    } else {
      setError(friendlyError(r.code, r.message));
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle={
        stage === "request"
          ? "Enter your email and we'll send a reset token."
          : "Enter the token from your email and a new password."
      }
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <ErrorBanner>{error}</ErrorBanner>
      <InfoBanner>{info}</InfoBanner>
      {stage === "request" ? (
        <form action={request} className="space-y-4">
          <Field label="Email" name="email" type="email" placeholder="you@company.com" required />
          <SubmitButton label="Send reset token" pendingLabel="Sending..." />
        </form>
      ) : (
        <form action={confirm} className="space-y-4">
          <Field label="Reset token" name="token" placeholder="Paste the token from your email" required />
          <Field
            label="New password"
            name="new_password"
            type="password"
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
          <SubmitButton label="Update password" pendingLabel="Updating..." />
        </form>
      )}
    </AuthShell>
  );
}
