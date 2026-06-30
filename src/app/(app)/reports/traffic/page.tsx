"use client";

import { useMemo } from "react";
import { orderBy, limit } from "firebase/firestore";
import { RequirePermission } from "@/components/auth/Guard";
import { useCollection } from "@/lib/db/hooks";
import { COLLECTIONS } from "@/lib/db/collections";
import {
  PageHeader,
  Card,
  CardBody,
  StatCard,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { BarChart3 } from "lucide-react";

interface TrafficDay {
  id: string;
  day: string;
  total?: number;
  uniques?: number;
  paths?: Record<string, number>;
  pathLabels?: Record<string, string>;
}

export default function TrafficPage() {
  return (
    <RequirePermission permission="reports.view">
      <Traffic />
    </RequirePermission>
  );
}

function Traffic() {
  const { data, loading, error } = useCollection<TrafficDay>(COLLECTIONS.siteTraffic, [
    orderBy("day", "desc"),
    limit(30),
  ]);

  const summary = useMemo(() => {
    const totalVisits = data.reduce((s, d) => s + (d.total ?? 0), 0);
    const totalUniques = data.reduce((s, d) => s + (d.uniques ?? 0), 0);
    const busiest = data.reduce((m, d) => Math.max(m, d.total ?? 0), 0);
    const avg = data.length ? Math.round(totalVisits / data.length) : 0;

    // Aggregate page popularity across the window.
    const pathTotals = new Map<string, { label: string; count: number }>();
    for (const d of data) {
      for (const [key, count] of Object.entries(d.paths ?? {})) {
        const label = d.pathLabels?.[key] ?? key;
        const prev = pathTotals.get(key);
        pathTotals.set(key, { label, count: (prev?.count ?? 0) + count });
      }
    }
    const topPaths = [...pathTotals.values()].sort((a, b) => b.count - a.count).slice(0, 12);
    const byDayAsc = [...data].reverse(); // oldest → newest for the chart
    return { totalVisits, totalUniques, busiest, avg, topPaths, byDayAsc };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Traffic"
        description="Privacy-first visit analytics for the public website — aggregate counts only, no personal data."
      />

      {loading ? (
        <LoadingState label="Loading traffic…" />
      ) : error ? (
        <ErrorState message="Failed to load traffic data." />
      ) : data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No visits recorded yet"
          description="Visit data appears here as people browse the public website."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total visits" value={summary.totalVisits.toLocaleString()} icon="Globe" tone="brand" />
            <StatCard label="Unique visitors" value={summary.totalUniques.toLocaleString()} icon="CircleCheck" tone="emerald" />
            <StatCard label="Avg visits / day" value={summary.avg.toLocaleString()} icon="Clock" tone="violet" />
            <StatCard label="Days tracked" value={String(data.length)} icon="TrendingUp" tone="gold" />
          </div>

          {/* Visits-by-day bar chart (dependency-free) */}
          <Card>
            <CardBody>
              <h2 className="text-base font-semibold text-navy-900">Visits by day</h2>
              <div className="mt-5 flex h-44 items-end gap-1.5 overflow-x-auto">
                {summary.byDayAsc.map((d) => {
                  const h = summary.busiest > 0 ? Math.round(((d.total ?? 0) / summary.busiest) * 100) : 0;
                  return (
                    <div key={d.id} className="flex min-w-[18px] flex-1 flex-col items-center gap-1">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-brand-600 to-brand-400"
                          style={{ height: `${Math.max(h, 2)}%` }}
                          title={`${d.day}: ${d.total ?? 0} visits, ${d.uniques ?? 0} unique`}
                        />
                      </div>
                      <span className="rotate-0 text-[9px] tabular-nums text-navy-400">{d.day.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Top pages */}
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Page</TH>
                  <TH className="text-right">Visits</TH>
                  <TH className="text-right">Share</TH>
                </TR>
              </THead>
              <TBody>
                {summary.topPaths.map((p) => (
                  <TR key={p.label}>
                    <TD className="font-mono text-xs text-navy-700">{p.label}</TD>
                    <TD className="text-right font-medium text-navy-800">{p.count.toLocaleString()}</TD>
                    <TD className="text-right text-navy-500">
                      {summary.totalVisits ? Math.round((p.count / summary.totalVisits) * 100) : 0}%
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>

          <p className="text-xs text-navy-400">
            We store only aggregate daily counts — no IP addresses, cookies or personal data. Unique
            visitors are estimated per day, so figures are indicative, not exact.
          </p>
        </>
      )}
    </div>
  );
}
