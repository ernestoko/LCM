"use client";

import Link from "next/link";
import { useShipments } from "@/lib/db/repositories/shipments";
import { useManifests } from "@/lib/db/repositories/manifests";
import { useRoutes } from "@/lib/db/repositories/routes";
import { computeSealMetrics } from "@/lib/analytics/metrics";
import { StatCard, Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { RecentShipments } from "./RecentShipments";
import { ROUTE_STATUS_META } from "@/constants/statuses";

export function SealDashboard() {
  const { data: shipments } = useShipments();
  const { data: manifests } = useManifests();
  const { data: routes } = useRoutes();

  const m = computeSealMetrics(shipments, manifests);
  const assignedRoutes = routes.filter((r) => r.status === "active" || r.status === "testing");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting Intake" value={m.awaitingIntake} icon="Inbox" tone="amber" href="/intake" />
        <StatCard label="Received" value={m.received} icon="PackageCheck" tone="brand" />
        <StatCard label="Ready for Dispatch" value={m.readyForDispatch} icon="PackageOpen" tone="gold" />
        <StatCard label="Active Manifests" value={m.activeManifests} icon="ClipboardList" tone="violet" href="/manifests" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="In Transit" value={m.inTransit} icon="Plane" tone="navy" />
        <StatCard label="Delivered" value={m.delivered} icon="CircleCheck" tone="emerald" />
        <StatCard label="Outstanding Updates" value={m.outstandingUpdates} icon="BellRing" tone="red" />
        <StatCard label="Assigned Routes" value={assignedRoutes.length} icon="Route" tone="brand" href="/country-routes" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentShipments shipments={shipments} />
        </div>
        <Card>
          <CardHeader title="Assigned routes" />
          <CardBody className="space-y-2">
            {assignedRoutes.length === 0 && <p className="text-sm text-navy-400">No active routes assigned.</p>}
            {assignedRoutes.map((r) => (
              <Link
                key={r.id}
                href="/country-routes"
                className="flex items-center justify-between rounded-lg border border-navy-100 px-3 py-2 hover:bg-navy-50"
              >
                <div>
                  <p className="text-sm font-medium text-navy-800">{r.countryName}</p>
                  <p className="text-xs text-navy-400">{r.code}</p>
                </div>
                <Badge tone={ROUTE_STATUS_META[r.status].tone}>{ROUTE_STATUS_META[r.status].label}</Badge>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
