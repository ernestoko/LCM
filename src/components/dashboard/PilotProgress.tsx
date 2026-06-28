"use client";

import Link from "next/link";
import type { PilotTracker } from "@/types";
import type { LibertyMetrics } from "@/lib/analytics/metrics";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { formatDate, daysBetween } from "@/lib/utils/dates";
import { formatMoney } from "@/lib/utils/format";

export function PilotProgress({ pilot, metrics }: { pilot: PilotTracker; metrics: LibertyMetrics }) {
  const totalDays = daysBetween(pilot.startDate, pilot.endDate) ?? 180;
  const elapsed = daysBetween(pilot.startDate, new Date().toISOString()) ?? 0;
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / Math.max(1, totalDays)) * 100)));

  return (
    <Card>
      <CardHeader
        title="6-Month Outsourcing Pilot"
        subtitle={`${formatDate(pilot.startDate)} → ${formatDate(pilot.endDate)} · Liberty & Liberty Logistics`}
        action={
          <Link href="/reports/pilot" className="text-xs font-medium text-brand-600 hover:underline">
            Full report
          </Link>
        }
      />
      <CardBody className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-navy-500">
            <span>Day {Math.max(0, elapsed)} of {totalDays}</span>
            <span>{pct}% elapsed</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-navy-100">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Shipments" value={metrics.totalShipments} />
          <Stat label="Delivery rate" value={`${metrics.deliveryRate}%`} />
          <Stat label="Liberty earnings" value={formatMoney(metrics.libertyEarnings)} />
          <Stat label="Countries onboarded" value={pilot.countriesOnboarded.length} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-navy-500">Recommendation:</span>
          <Badge tone={pilot.recommendation === "undecided" ? "neutral" : "info"}>
            {pilot.recommendation.charAt(0).toUpperCase() + pilot.recommendation.slice(1)}
          </Badge>
        </div>
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-navy-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-navy-900">{value}</p>
    </div>
  );
}
