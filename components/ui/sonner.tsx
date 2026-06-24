"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** App-wide toast host. Styled to the dark fintech theme via token classes. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group rounded-xl border border-border bg-popover text-popover-foreground shadow-xl",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
