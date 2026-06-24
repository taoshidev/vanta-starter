"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className={cn(className)}>
      {copied ? <Check className="text-success" /> : <Copy />}
      {label}
    </Button>
  );
}
