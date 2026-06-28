"use client";

import Link from "next/link";
import { useShipments } from "@/lib/db/repositories/shipments";
import { useInvoices } from "@/lib/db/repositories/invoices";
import { usePayments } from "@/lib/db/repositories/payments";
import { useComplaints } from "@/lib/db/repositories/complaints";
import { useRoutes } from "@/lib/db/repositories/routes";
import { usePilotTracker } from "@/lib/db/repositories/settings";
import { computeLibertyMetrics, countByStatus } from "@/lib/analytics/metrics";
import { StatCard, Card, CardHeader, CardBody } from "@/components/ui";
import { BarList } from "./BarList";
import { RecentShipments } from "./RecentShipments";
import { PilotProgress } from "./PilotProgress";
import { formatMoney } from "@/lib/utils/format";
import { SHIPMENT_STATUS_META } from "@/constants/statuses";

export function LibertyDashboard() {
  const { data: shipments } = useShipments();
  const { data: invoices } = useInvoices();
  const { data: payments } = usePayments();
  const { data: complaints } = useComplaints();
  const { data: routes } = useRoutes();
  const { pilot } = usePilotTracker();

  const m = computeLibertyMetrics(shipments, invoices, payments, complaints, routes);
  const byStatus = countByStatus(shipments);
  const statusBars = Object.entries(byStatus)
    .map(([k, v]) => ({ label: SHIPMENT_STATUS_META[k as keyof typeof SHIPMENT_STATUS_META]?.label ?? k, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Shipments" value={m.totalShipments} icon="Package" tone="brand" href="/shipments" />
        <StatCard label="Active" value={m.activeShipments} icon="Truck" tone="navy" hint={`${m.deliveryRate}% delivery rate`} />
        <StatCard label="Delivered" value={m.deliveredShipments} icon="CircleCheck" tone="emerald" />
        <StatCard label="Delayed" value={m.delayedShipments} icon="Clock" tone="amber" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue Collected" value={formatMoney(m.revenue)} icon="Wallet" tone="emerald" />
        <StatCard label="Liberty Earnings" value={formatMoney(m.libertyEarnings)} icon="TrendingUp" tone="gold" hint="Commission + platform fees" />
        <StatCard label="SEAL Op. Charges" value={formatMoney(m.sealCharges)} icon="Building2" tone="violet" />
        <StatCard label="Pending Payments" value={formatMoney(m.pendingPaymentAmount)} icon="CircleAlert" tone="red" hint={`${m.pendingPayments} invoices`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentShipments shipments={shipments} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Pipeline by status" />
            <CardBody>
              <BarList items={statusBars} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Operations snapshot" />
            <CardBody className="grid grid-cols-2 gap-4">
              <Mini label="Active countries" value={m.activeCountries} href="/country-routes" />
              <Mini label="Open complaints" value={m.openComplaints} href="/complaints" />
              <Mini label="Service fees" value={formatMoney(m.serviceFees)} />
              <Mini label="Delivery rate" value={`${m.deliveryRate}%`} />
            </CardBody>
          </Card>
        </div>
      </div>

      <PilotProgress pilot={pilot} metrics={m} />
    </div>
  );
}

function Mini({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="rounded-lg border border-navy-100 p-3">
      <p className="text-xs text-navy-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-navy-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
