"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";
import { logError } from "@/lib/observability/logError";

/**
 * Error boundary scoped to the authenticated app. Rendered inside the AppShell
 * content area, so it only fills the page region (the nav/shell stays intact).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { scope: "app-boundary", digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardBody className="px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <h1 className="text-lg font-semibold text-navy-900">Something went wrong</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-navy-500">
            We couldn&apos;t load this page. This is usually temporary — try again,
            or return to your dashboard.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => reset()}>
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" type="button" className="w-full sm:w-auto">
                <LayoutDashboard className="h-4 w-4" />
                Back to dashboard
              </Button>
            </Link>
          </div>

          {error.digest && (
            <p className="mt-6 font-mono text-[11px] text-navy-400">
              Reference: {error.digest}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
