"use client";

import Link from "next/link";
import {
  PackagePlus,
  ScanLine,
  ClipboardList,
  Inbox,
  Users,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useShipments } from "@/lib/db/repositories/shipments";
import { useInvoices } from "@/lib/db/repositories/invoices";
import { usePayments } from "@/lib/db/repositories/payments";
import { useComplaints } from "@/lib/db/repositories/complaints";
import { useRoutes } from "@/lib/db/repositories/routes";
import { computeLibertyMetrics, countByStatus } from "@/lib/analytics/metrics";
import { useAuth } from "@/lib/auth/AuthProvider";
import { StatCard, Card, CardHeader, CardBody } from "@/components/ui";
import { BarList } from "./BarList";
import { RecentShipments } from "./RecentShipments";
import { formatMoney } from "@/lib/utils/format";
import { SHIPMENT_STATUS_META } from "@/constants/statuses";
import type { Permission } from "@/lib/auth/permissions";

const QUICK_ACTIONS: { label: string; href: string; icon: LucideIcon; permission: Permission }[] = [
  { label: "New shipment", href: "/shipments/new", icon: PackagePlus, permission: "shipments.create" },
  { label: "Package intake", href: "/intake", icon: ScanLine, permission: "intake.manage" },
  { label: "Build manifest", href: "/manifests/new", icon: ClipboardList, permission: "manifests.create" },
  { label: "Requests", href: "/requests", icon: Inbox, permission: "requests.view" },
  { label: "Customers", href: "/customers", icon: Users, permission: "customers.view" },
];

export function LibertyDashboard() {
  const { can } = useAuth();
  const { data: shipments } = useShipments();
  const { data: invoices } = useInvoices();
  const { data: payments } = usePayments();
  const { data: complaints } = useComplaints();
  const { data: routes } = useRoutes();

  const m = computeLibertyMetrics(shipments, invoices, payments, complaints, routes);
  const byStatus = countByStatus(shipments);
  const statusBars = Object.entries(byStatus)
    .map(([k, v]) => ({
      label: SHIPMENT_STATUS_META[k as keyof typeof SHIPMENT_STATUS_META]?.label ?? k,
      value: v,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  const actions = QUICK_ACTIONS.filter((a) => can(a.permission));

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      {actions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <a.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-navy-800">{a.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-navy-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </Link>
          ))}
        </div>
      )}

      {/* Operations KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Shipments" value={m.totalShipments} icon="Package" tone="brand" href="/shipments" />
        <StatCard label="Active" value={m.activeShipments} icon="Truck" tone="navy" hint={`${m.deliveryRate}% delivery rate`} />
        <StatCard label="Delivered" value={m.deliveredShipments} icon="CircleCheck" tone="emerald" />
        <StatCard label="Delayed" value={m.delayedShipments} icon="Clock" tone="amber" />
      </div>

      {/* Finance KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue Collected" value={formatMoney(m.revenue)} icon="Wallet" tone="emerald" />
        <StatCard label="Liberty Earnings" value={formatMoney(m.libertyEarnings)} icon="TrendingUp" tone="gold" hint="Commission + platform fees" />
        <StatCard label="Operational charges" value={formatMoney(m.sealCharges)} icon="Building2" tone="violet" />
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
    </div>
  );
}

function Mini({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="rounded-lg border border-navy-100 p-3 transition-colors hover:border-brand-200 hover:bg-navy-50/40">
      <p className="text-xs text-navy-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-navy-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
