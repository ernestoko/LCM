"use client";

import Link from "next/link";
import {
  Truck,
  Warehouse,
  Search,
  Package,
  ArrowRight,
  MapPin,
  Copy,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCustomerShipments } from "@/lib/db/repositories/shipments";
import { useCustomerInvoices } from "@/lib/db/repositories/invoices";
import { useCustomerRequests } from "@/lib/db/repositories/requests";
import { useDocument } from "@/lib/db/hooks";
import { COLLECTIONS } from "@/lib/db/collections";
import { WAREHOUSES, warehouseAddressLines } from "@/constants/warehouses";
import {
  StatCard,
  Card,
  CardHeader,
  CardBody,
  StatusBadge,
  Badge,
  Button,
  EmptyState,
} from "@/components/ui";
import {
  SHIPMENT_STATUS_META,
  PAYMENT_STATUS_META,
  shipmentStatusOrder,
  REQUEST_STATUS_META,
  REQUEST_TYPE_LABELS,
} from "@/constants/statuses";
import { formatMoney } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import type { Customer } from "@/types";

const ACTIONS = [
  {
    href: "/request/pickup",
    icon: Truck,
    title: "Request a Pickup",
    desc: "We'll collect your package from your door.",
    tone: "from-brand-600 to-brand-700",
  },
  {
    href: "/request/warehouse",
    icon: Warehouse,
    title: "Ship to our Warehouse",
    desc: "Send online orders to your Liberty address.",
    tone: "from-navy-800 to-navy-900",
  },
  {
    href: "/track",
    icon: Search,
    title: "Track a Shipment",
    desc: "Follow any shipment in real time.",
    tone: "from-gold-500 to-gold-600",
  },
];

export function CustomerDashboard() {
  const { user } = useAuth();
  const customerId = user?.customerId;
  const { data: shipments } = useCustomerShipments(customerId);
  const { data: invoices } = useCustomerInvoices(customerId);
  const { data: requests } = useCustomerRequests(customerId);
  const { data: customer } = useDocument<Customer>(COLLECTIONS.customers, customerId ?? "");

  const firstName = (customer?.fullName ?? user?.displayName ?? "there").split(" ")[0];

  const active = shipments.filter(
    (s) => s.status !== "delivered" && s.status !== "cancelled" && s.status !== "consolidated",
  );
  const inTransit = shipments.filter((s) =>
    ["dispatched", "in_transit", "arrived_ghana", "customs_clearing", "out_for_delivery"].includes(s.status),
  );
  const openRequests = requests.filter((r) =>
    ["submitted", "in_review", "scheduled", "received"].includes(r.status),
  );
  const outstanding = invoices.filter((i) => i.balanceDue > 0);
  const outstandingTotal = outstanding.reduce((s, i) => s + i.balanceDue, 0);

  if (!customerId) {
    return (
      <EmptyState
        icon={Package}
        title="No customer profile linked"
        description="Your account isn't linked to a customer record yet. Please contact Liberty & Liberty Logistics support."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-navy-500">What would you like to ship today?</p>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group relative overflow-hidden rounded-2xl border border-navy-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${a.tone} text-white shadow-card`}>
              <a.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-base font-bold text-navy-900">{a.title}</h3>
            <p className="mt-1 text-sm text-navy-500">{a.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              Start <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Shipments" value={active.length} icon="Truck" tone="brand" href="/shipments" />
        <StatCard label="In Transit" value={inTransit.length} icon="Plane" tone="violet" href="/shipments" />
        <StatCard label="Open Requests" value={openRequests.length} icon="Inbox" tone="amber" href="/requests" />
        <StatCard label="Balance Due" value={formatMoney(outstandingTotal)} icon="Wallet" tone="red" href="/invoices" />
      </div>

      {/* Warehouse address */}
      {customer ? <WarehouseCard customer={customer} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent requests */}
        <Card>
          <CardHeader
            title="Your requests"
            action={<Link href="/requests" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>}
          />
          <CardBody className="space-y-2">
            {requests.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No requests yet"
                description="Request a pickup or pre-alert a warehouse parcel."
                action={
                  <Link href="/request/pickup"><Button size="sm"><Truck className="h-4 w-4" /> Request a Pickup</Button></Link>
                }
              />
            ) : (
              requests.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href="/requests"
                  className="flex items-center justify-between rounded-lg border border-navy-100 px-4 py-3 transition-shadow hover:shadow-card"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={r.type === "pickup" ? "warning" : "purple"}>{REQUEST_TYPE_LABELS[r.type]}</Badge>
                      <span className="font-mono text-[11px] text-navy-400">{r.requestNumber}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-navy-500">{r.packageDescription}</p>
                  </div>
                  <StatusBadge meta={REQUEST_STATUS_META[r.status]} />
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        {/* Recent shipments */}
        <Card>
          <CardHeader
            title="Your shipments"
            action={<Link href="/shipments" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>}
          />
          <CardBody className="space-y-3">
            {shipments.length === 0 ? (
              <EmptyState icon={Package} title="No shipments yet" description="They'll appear here once your request is on its way." />
            ) : (
              shipments.slice(0, 5).map((s) => {
                const order = shipmentStatusOrder(s.cargoType);
                const stepIndex = order.indexOf(s.status);
                const pct = stepIndex >= 0 ? Math.round(((stepIndex + 1) / order.length) * 100) : 0;
                return (
                  <Link key={s.id} href={`/shipments/${s.id}`} className="block rounded-lg border border-navy-100 p-4 transition-shadow hover:shadow-card">
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
              })
            )}
          </CardBody>
        </Card>
      </div>

      {/* Invoices to pay */}
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
                  <Link href={`/invoices/${i.id}`}><Button size="sm" variant="outline">View</Button></Link>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function WarehouseCard({ customer }: { customer: Customer }) {
  const hub = WAREHOUSES.find((w) => w.primary) ?? WAREHOUSES[0];
  const lines = warehouseAddressLines(hub, customer.fullName, customer.customerCode);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* no-op */
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
              <MapPin className="h-3.5 w-3.5" /> Your {hub.flag} {hub.name} address
            </p>
            <p className="mt-1.5 text-sm text-navy-700">
              {lines[2]} · {hub.line1}, {hub.city}, {hub.region} {hub.postal}
            </p>
            <p className="mt-0.5 text-xs text-navy-400">
              Ship your online orders here and we forward them to you.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
            </Button>
            <Link href="/request/warehouse"><Button size="sm">Details <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
