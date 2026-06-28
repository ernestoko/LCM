"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, PackageSearch } from "lucide-react";
import { LogoWordmark } from "@/components/brand/Logo";
import { Button, Input } from "@/components/ui";

/**
 * Public, unauthenticated tracking landing page. Self-contained and branded —
 * it lives outside the `(app)` route group so it gets no authenticated shell.
 */
export default function TrackLandingPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trackingNumber = value.trim();
    if (!trackingNumber) return;
    router.push(`/track/${encodeURIComponent(trackingNumber)}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-navy-50">
      {/* Header */}
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/track" aria-label="Liberty Cargo Movers — Track">
            <LogoWordmark />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Staff sign in
          </Link>
        </div>
      </header>

      {/* Hero + search */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-gold-300">
            <PackageSearch className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            Track your shipment
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-navy-500 sm:text-base">
            Enter your tracking number to follow your package from intake to
            delivery — USA to Ghana and beyond.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-3 sm:flex sm:gap-3 sm:space-y-0">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. LCM-2606-AB12CD"
              aria-label="Tracking number"
              autoComplete="off"
              autoCapitalize="characters"
              className="font-mono"
            />
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              <Search className="h-4 w-4" />
              Track
            </Button>
          </form>
          <p className="mt-3 text-xs text-navy-400">
            Your tracking number appears on your receipt and confirmation messages.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-100 bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-navy-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Liberty Cargo Movers. All rights reserved.</p>
          <Link href="/login" className="font-medium text-navy-500 hover:text-brand-600">
            Staff sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
