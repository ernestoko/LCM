import Link from "next/link";
import { LayoutDashboard, PackageSearch } from "lucide-react";
import { LogoWordmark } from "@/components/brand/Logo";

/**
 * App Router 404 page. Self-contained and branded — rendered outside the
 * authenticated shell, so it carries its own layout. Static server component.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-card">
        <div className="mb-6 flex justify-center">
          <LogoWordmark />
        </div>

        <p className="text-5xl font-bold tracking-tight text-navy-900">404</p>
        <h1 className="mt-3 text-lg font-semibold text-navy-900">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-navy-500">
          The page you are looking for has moved, no longer exists, or the link
          was mistyped. Let&apos;s get you back on track.
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to dashboard
          </Link>
          <Link
            href="/track"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-navy-200 bg-white px-4 text-sm font-medium text-navy-800 transition-colors hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1"
          >
            <PackageSearch className="h-4 w-4" />
            Track a shipment
          </Link>
        </div>
      </div>
    </main>
  );
}
