import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Vanta — Prop Trading, Powered by Hyperscaled",
    template: "%s · Vanta",
  },
  description:
    "A world-class reference app built on hyperscaled-api: onboarding, KYC, payments, payouts, and live trading.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
