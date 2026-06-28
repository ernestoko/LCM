"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCustomerShipments } from "@/lib/db/repositories/shipments";
import { useCustomerInvoices } from "@/lib/db/repositories/invoices";
import { StatCard, Card, CardHeader, CardBody, StatusBadge, Button, EmptyState } from "@/components/ui";
import { SHIPMENT_STATUS_META, PAYMENT_STATUS_META, SHIPMENT_STATUS_ORDER } from "@/constants/statuses";
import { formatMoney } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { Package } from "lucide-react";

export function CustomerDashboard() {
  const { user } = useAuth();
  const customerId = user?.customerId;
  const { data: shipments } = useCustomerShipments(customerId);
  const { data: invoices } = useCustomerInvoices(customerId);

  const active = shipments.filter((s) => s.status !== "delivered" && s.status !== "cancelled");
  const outstanding = invoices.filter((i) => i.balanceDue > 0);
  const outstandingTotal = outstanding.reduce((s, i) => s + i.balanceDue, 0);

  if (!customerId) {
    return (
      <EmptyState
        icon={Package}
        title="No customer profile linked"
        description="Your account isn't linked to a customer record yet. Please contact Liberty Cargo Movers support."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Shipments" value={active.length} icon="Truck" tone="brand" href="/shipments" />
        <StatCard label="Delivered" value={shipments.filter((s) => s.status === "delivered").length} icon="CircleCheck" tone="emerald" />
        <StatCard label="Open Invoices" value={outstanding.length} icon="FileText" tone="amber" href="/invoices" />
        <StatCard label="Balance Due" value={formatMoney(outstandingTotal)} icon="Wallet" tone="red" />
      </div>

      <Card>
        <CardHeader title="Your shipments" />
        <CardBody className="space-y-3">
          {shipments.length === 0 && (
            <EmptyState icon={Package} title="No shipments yet" description="Your shipments will appear here once Liberty Cargo Movers creates them." />
          )}
          {shipments.slice(0, 10).map((s) => {
            const stepIndex = SHIPMENT_STATUS_ORDER.indexOf(s.status);
            const pct = stepIndex >= 0 ? Math.round(((stepIndex + 1) / SHIPMENT_STATUS_ORDER.length) * 100) : 0;
            return (
              <Link
                key={s.id}
                href={`/shipments/${s.id}`}
                className="block rounded-lg border border-navy-100 p-4 transition-shadow hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold text-navy-900">{s.trackingNumber}</p>
                    <p className="text-xs text-navy-400">{s.routeCode} · {formatDate(s.createdAt)}</p>
                  </div>
                  <StatusBadge meta={SHIPMENT_STATUS_META[s.status]} />
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-navy-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </CardBody>
      </Card>

      {outstanding.length > 0 && (
        <Card>
          <CardHeader title="Invoices to pay" />
          <CardBody className="space-y-2">
            {outstanding.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-lg border border-navy-100 px-4 py-3">
                <div>
                  <p className="font-mono text-sm font-medium text-navy-800">{i.invoiceNumber}</p>
                  <p className="text-xs text-navy-400">{i.trackingNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge meta={PAYMENT_STATUS_META[i.paymentStatus]} />
                  <span className="font-semibold text-navy-900">{formatMoney(i.balanceDue, i.currency)}</span>
                  <Link href={`/invoices/${i.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
