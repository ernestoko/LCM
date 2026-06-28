"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function TrackingBar({
  className,
  variant = "hero",
}: {
  className?: string;
  variant?: "hero" | "inline";
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/track/${encodeURIComponent(trimmed)}`);
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
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter tracking number"
            aria-label="Tracking number"
            className="w-full rounded-lg bg-transparent py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
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
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter your tracking number"
            className="w-full rounded-xl border border-navy-200 bg-white py-3.5 pl-12 pr-4 text-base text-navy-900 placeholder:text-navy-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Track Shipment
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
