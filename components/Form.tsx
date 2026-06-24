"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Inline error banner — wraps long messages so they never overflow the card. */
export function ErrorBanner({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export function InfoBanner({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <Alert variant="success" className="mb-4">
      <CheckCircle2 />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

/** Submit button that reflects the enclosing <form>'s pending state. */
export function SubmitButton({
  label,
  pendingLabel,
  className,
  ...props
}: { label: string; pendingLabel?: string } & ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className={cn("w-full", className)} {...props}>
      {pending ? (pendingLabel ?? label) : label}
    </Button>
  );
}

/** Labeled input field with optional hint + error text. */
export function Field({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: { label: string; hint?: string; error?: string } & InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={inputId}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <Input id={inputId} aria-invalid={Boolean(error)} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
