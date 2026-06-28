/**
 * Route-group loading skeleton for the authenticated app. Rendered inside the
 * AppShell content area while a page streams in. Mirrors the typical page
 * layout: header strip, stat row, then a list/table block.
 */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <span className="sr-only">Loading…</span>

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-md bg-navy-100" />
          <div className="h-3.5 w-64 rounded bg-navy-100/70" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-navy-100" />
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
            <div className="h-3.5 w-20 rounded bg-navy-100" />
            <div className="mt-3 h-7 w-24 rounded-md bg-navy-100" />
          </div>
        ))}
      </div>

      {/* List / table block */}
      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-card">
        <div className="border-b border-navy-100 px-5 py-4">
          <div className="h-4 w-40 rounded bg-navy-100" />
        </div>
        <div className="divide-y divide-navy-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-9 w-9 rounded-full bg-navy-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-navy-100" />
                <div className="h-3 w-1/4 rounded bg-navy-100/70" />
              </div>
              <div className="h-5 w-16 rounded-full bg-navy-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
