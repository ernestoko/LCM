"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ShipmentStatus } from "@/types";
import type { BadgeTone } from "@/constants/statuses";
import { RequirePermission } from "@/components/auth/Guard";
import { useShipments } from "@/lib/db/repositories/shipments";
import { useInvoices } from "@/lib/db/repositories/invoices";
import { usePayments } from "@/lib/db/repositories/payments";
import {
  computeLibertyMetrics,
  computeFinanceMetrics,
  countByStatus,
} from "@/lib/analytics/metrics";
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardBody,
  StatCard,
  LoadingState,
  ErrorState,
} from "@/components/ui";
import { BarChart, DonutChart, LineChart } from "@/components/charts";
import { SHIPMENT_STATUS_META } from "@/constants/statuses";
import { formatMoney, formatNumber } from "@/lib/utils/format";

// Concrete hex colours so SVG fills never depend on Tailwind classes.
const HEX = {
  brand: "#b6881a", // brand-500 (gold)
  emerald: "#10b981",
  gold: "#c78d2c", // gold-500
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  navy: "#0f1b3d", // navy-900
} as const;

/** Map a status badge tone to a chart-friendly hex colour. */
const TONE_HEX: Record<BadgeTone, string> = {
  neutral: HEX.navy,
  info: HEX.brand,
  warning: HEX.amber,
  success: HEX.emerald,
  danger: HEX.red,
  purple: HEX.violet,
  gold: HEX.gold,
};

// A rotating palette for destination bars (distinct, on-brand colours).
const COUNTRY_PALETTE = [
  HEX.brand,
  HEX.gold,
  HEX.emerald,
  HEX.violet,
  HEX.amber,
  HEX.red,
  HEX.navy,
];

function AnalyticsDashboard() {
  const { data: shipments, loading: lShip, error: eShip } = useShipments();
  const { data: invoices, loading: lInv, error: eInv } = useInvoices();
  const { data: payments, loading: lPay, error: ePay } = usePayments();

  const loading = lShip || lInv || lPay;
  const error = eShip || eInv || ePay;

  const currency = invoices[0]?.currency ?? "USD";

  const liberty = useMemo(
    () => computeLibertyMetrics(shipments, invoices, payments, [], []),
    [shipments, invoices, payments],
  );
  const finance = useMemo(
    () => computeFinanceMetrics(invoices, payments),
    [invoices, payments],
  );

  // --- Revenue trend: last 6 months of payments, summed by month ----------
  const revenueTrend = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; value: number }[] = [];
    const index = new Map<string, number>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString("en-US", { month: "short" });
      index.set(key, buckets.length);
      buckets.push({ key, label, value: 0 });
    }

    for (const p of payments) {
      const raw = p.paymentDate || p.createdAt;
      if (!raw) continue;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const slot = index.get(key);
      if (slot != null) buckets[slot].value += p.amount || 0;
    }

    return buckets.map((b) => ({
      label: b.label,
      value: Math.round((b.value + Number.EPSILON) * 100) / 100,
    }));
  }, [payments]);

  const hasRevenue = revenueTrend.some((d) => d.value > 0);

  // --- Shipments by status (donut) ----------------------------------------
  const statusData = useMemo(() => {
    const counts = countByStatus(shipments);
    return (Object.keys(counts) as ShipmentStatus[])
      .map((s) => {
        const meta = SHIPMENT_STATUS_META[s];
        return {
          label: meta?.label ?? s,
          value: counts[s],
          color: TONE_HEX[meta?.tone ?? "neutral"],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [shipments]);

  // --- Shipments by destination (bar) -------------------------------------
  const destinationData = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of shipments) {
      const key = s.destinationCountry || "Unknown";
      out[key] = (out[key] ?? 0) + 1;
    }
    return Object.entries(out)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((d, i) => ({
        ...d,
        color: COUNTRY_PALETTE[i % COUNTRY_PALETTE.length],
      }));
  }, [shipments]);

  // --- Revenue vs Liberty earnings vs SEAL charges (bar) ------------------
  const financeBars = useMemo(
    () => [
      { label: "Revenue", value: finance.totalCollected, color: HEX.emerald },
      { label: "Liberty", value: liberty.libertyEarnings, color: HEX.gold },
      { label: "Operations", value: liberty.sealCharges, color: HEX.navy },
    ],
    [finance.totalCollected, liberty.libertyEarnings, liberty.sealCharges],
  );

  const hasFinance = financeBars.some((d) => d.value > 0);

  if (loading) return <LoadingState label="Loading analytics…" />;
  if (error) return <ErrorState message={error.message} />;

  const money = (v: number) => formatMoney(v, currency);
  // Compact money for chart axes/labels to avoid crowding.
  const moneyCompact = (v: number) => {
    if (Math.abs(v) >= 1000) return `${currency === "USD" ? "$" : ""}${(v / 1000).toFixed(1)}k`;
    return formatMoney(v, currency);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visual Analytics"
        description="Revenue, status mix and route distribution at a glance."
        actions={
          <Link href="/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to Reports
            </Button>
          </Link>
        }
      />

      {/* Header KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={money(liberty.revenue)}
          icon="DollarSign"
          tone="emerald"
        />
        <StatCard
          label="Liberty Earnings"
          value={money(liberty.libertyEarnings)}
          icon="TrendingUp"
          tone="gold"
        />
        <StatCard
          label="Delivered"
          value={formatNumber(liberty.deliveredShipments)}
          icon="PackageCheck"
          tone="brand"
          hint={`${liberty.deliveryRate}% delivery rate`}
        />
        <StatCard
          label="Active"
          value={formatNumber(liberty.activeShipments)}
          icon="Truck"
          tone="violet"
          hint={`${formatNumber(liberty.totalShipments)} total shipments`}
        />
      </div>

      {/* Revenue trend (full width) */}
      <Card>
        <CardHeader
          title="Revenue Trend"
          subtitle="Payments collected over the last 6 months."
        />
        <CardBody>
          <div className="h-72 w-full">
            <LineChart
              data={revenueTrend}
              title="Monthly revenue collected over the last six months"
              formatValue={moneyCompact}
              emptyLabel={
                hasRevenue ? "No data to display" : "No payments recorded yet"
              }
            />
          </div>
        </CardBody>
      </Card>

      {/* Status mix + destinations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Shipments by Status"
            subtitle={`${formatNumber(shipments.length)} total shipments.`}
          />
          <CardBody>
            <DonutChart
              data={statusData}
              centerLabel="Shipments"
              title="Distribution of shipments across lifecycle statuses"
              formatValue={(v) => formatNumber(v)}
              emptyLabel="No shipments yet"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Shipments by Destination"
            subtitle="Top destination countries by shipment volume."
          />
          <CardBody>
            <div className="h-72 w-full">
              <BarChart
                data={destinationData}
                title="Shipment count grouped by destination country"
                formatValue={(v) => formatNumber(v)}
                emptyLabel="No shipments yet"
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Revenue vs earnings vs SEAL charges */}
      <Card>
        <CardHeader
          title="Revenue vs Liberty Earnings vs Operational Charges"
          subtitle="Collected revenue against Liberty's commission and Operations payable."
        />
        <CardBody>
          <div className="h-72 w-full">
            <BarChart
              data={financeBars}
              title="Comparison of collected revenue, Liberty earnings and operational charges"
              formatValue={moneyCompact}
              emptyLabel={
                hasFinance ? "No data to display" : "No financial activity yet"
              }
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <RequirePermission permission="reports.view">
      <AnalyticsDashboard />
    </RequirePermission>
  );
}
