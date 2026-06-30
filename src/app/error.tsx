"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { LogoWordmark } from "@/components/brand/Logo";
import { logError } from "@/lib/observability/logError";

/**
 * Route-level error boundary for the App Router. Catches errors thrown while
 * rendering pages outside the authenticated shell. Self-contained and branded.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { scope: "route-boundary", digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-card">
        <div className="mb-6 flex justify-center">
          <LogoWordmark />
        </div>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h1 className="text-lg font-semibold text-navy-900">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-navy-500">
          We hit an unexpected problem while loading this page. You can try again,
          or head back to your dashboard.
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-navy-200 bg-white px-4 text-sm font-medium text-navy-800 transition-colors hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to dashboard
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 font-mono text-[11px] text-navy-400">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
