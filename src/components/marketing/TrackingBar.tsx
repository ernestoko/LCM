"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Lenient sanity check: a tracking number is a few letters/digits, often with
 *  a dash (e.g. LCM-2606-AB12CD). We only reject input that clearly cannot be
 *  one, so we never block a valid number — just steer obvious typos. */
const TRACKING_RE = /^[A-Za-z0-9][A-Za-z0-9-]{3,}$/;

export function TrackingBar({
  className,
  variant = "hero",
}: {
  className?: string;
  variant?: "hero" | "inline";
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter your tracking number to see live status.");
      return;
    }
    if (!TRACKING_RE.test(trimmed)) {
      setError("That doesn't look like a tracking number — check for typos (e.g. LCM-2606-AB12CD).");
      return;
    }
    setError(null);
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  }

  function onChange(next: string) {
    setValue(next);
    if (error) setError(null);
  }

  if (variant === "inline") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-navy-200 bg-white p-1.5 shadow-card",
          className,
        )}
        role="search"
        aria-label="Track a shipment"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
            aria-hidden="true"
          />
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter tracking number"
            aria-label="Tracking number"
            aria-invalid={!!error}
            title={error ?? undefined}
            suppressHydrationWarning
            className="w-full rounded-lg bg-transparent py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-hidden"
          />
        </div>
        <button
          type="submit"
          suppressHydrationWarning
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
        >
          Track
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "w-full rounded-2xl border border-white/40 bg-white/95 p-3 shadow-card-hover backdrop-blur sm:p-4",
        className,
      )}
      role="search"
      aria-label="Track a shipment"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="hero-tracking-input">
          Tracking number
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400"
            aria-hidden="true"
          />
          <input
            id="hero-tracking-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your tracking number"
            aria-invalid={!!error}
            aria-describedby="hero-tracking-msg"
            suppressHydrationWarning
            className={cn(
              "w-full rounded-xl border bg-white py-3.5 pl-12 pr-4 text-base text-navy-900 placeholder:text-navy-600 transition-colors focus:outline-hidden focus:ring-4",
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                : "border-navy-200 focus:border-brand-400 focus:ring-brand-500/15",
            )}
          />
        </div>
        <button
          type="submit"
          suppressHydrationWarning
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Track Shipment
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Format hint by default; a clear, recoverable error on bad input. */}
      <div id="hero-tracking-msg" className="mt-2 px-1 text-sm">
        {error ? (
          <p role="alert" className="flex flex-wrap items-center gap-x-2 font-medium text-red-600">
            <span>{error}</span>
            <Link href="/contact" className="font-semibold text-red-700 underline underline-offset-2 hover:text-red-800">
              Can't find your number?
            </Link>
          </p>
        ) : (
          <p className="text-navy-600">
            Looks like <span className="font-mono font-medium text-navy-700">LCM-2606-AB12CD</span>. Not sure?{" "}
            <Link href="/contact" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
              We'll help you find it.
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}
