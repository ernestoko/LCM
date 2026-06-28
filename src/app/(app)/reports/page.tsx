"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Download, FileBarChart2, Gauge } from "lucide-react";
import type { ShipmentStatus } from "@/types";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useShipments } from "@/lib/db/repositories/shipments";
import { useInvoices } from "@/lib/db/repositories/invoices";
import { usePayments } from "@/lib/db/repositories/payments";
import { useComplaints } from "@/lib/db/repositories/complaints";
import { useRoutes } from "@/lib/db/repositories/routes";
import {
  computeLibertyMetrics,
  computeFinanceMetrics,
  countByStatus,
} from "@/lib/analytics/metrics";
import { downloadCsv } from "@/components/reports/csv";
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardBody,
  StatCard,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  Badge,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui";
import { SHIPMENT_STATUS_META } from "@/constants/statuses";
import { formatMoney, formatNumber, round2 } from "@/lib/utils/format";

function ReportsHub() {
  const { can } = useAuth();
  const canExport = can("reports.export");

  const { data: shipments, loading: lShip, error: eShip } = useShipments();
  const { data: invoices, loading: lInv, error: eInv } = useInvoices();
  const { data: payments, loading: lPay } = usePayments();
  const { data: complaints, loading: lCom } = useComplaints();
  const { data: routes, loading: lRoute } = useRoutes();

  const loading = lShip || lInv || lPay || lCom || lRoute;
  const error = eShip || eInv;

  const currency = invoices[0]?.currency ?? "USD";

  const liberty = useMemo(
    () => computeLibertyMetrics(shipments, invoices, payments, complaints, routes),
    [shipments, invoices, payments, complaints, routes],
  );
  const finance = useMemo(
    () => computeFinanceMetrics(invoices, payments),
    [invoices, payments],
  );

  // --- Shipments by status -------------------------------------------------
  const byStatus = useMemo(() => countByStatus(shipments), [shipments]);
  const statusRows = useMemo(
    () =>
      (Object.keys(byStatus) as ShipmentStatus[])
        .map((s) => ({
          status: s,
          label: SHIPMENT_STATUS_META[s]?.label ?? s,
          count: byStatus[s],
        }))
        .sort((a, b) => b.count - a.count),
    [byStatus],
  );
  const maxStatusCount = statusRows.reduce((m, r) => Math.max(m, r.count), 0);

  // --- Shipments by destination country ------------------------------------
  const byCountry = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of shipments) {
      const key = s.destinationCountry || "Unknown";
      out[key] = (out[key] ?? 0) + 1;
    }
    return Object.entries(out)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [shipments]);
  const maxCountryCount = byCountry.reduce((m, r) => Math.max(m, r.count), 0);

  // --- Commission report ---------------------------------------------------
  const commissionRows = useMemo(
    () =>
      invoices.map((inv) => {
        const c = inv.commission;
        return {
          invoice: inv,
          customer: inv.customerName,
          route: inv.routeCode,
          sealCharge: c?.sealCharge ?? 0,
          libertyCommission: c?.libertyCommission ?? 0,
          platformFee: c?.platformFee ?? 0,
          libertyEarnings: c?.libertyEarnings ?? 0,
        };
      }),
    [invoices],
  );
  const commissionTotals = useMemo(
    () =>
      commissionRows.reduce(
        (t, r) => ({
          sealCharge: round2(t.sealCharge + r.sealCharge),
          libertyCommission: round2(t.libertyCommission + r.libertyCommission),
          platformFee: round2(t.platformFee + r.platformFee),
          libertyEarnings: round2(t.libertyEarnings + r.libertyEarnings),
        }),
        { sealCharge: 0, libertyCommission: 0, platformFee: 0, libertyEarnings: 0 },
      ),
    [commissionRows],
  );

  // --- Weekly reconciliation summary ---------------------------------------
  const reconciliation = useMemo(() => {
    const completed = shipments.filter((s) => s.status === "delivered").length;
    return {
      totalShipments: shipments.length,
      customerPayments: finance.totalCollected,
      sealCharges: finance.sealPayable,
      libertyCommission: finance.libertyCommission,
      pending: finance.outstanding,
      disputed: finance.disputed,
      completed,
    };
  }, [shipments, finance]);

  if (loading) return <LoadingState label="Loading reports…" />;
  if (error) return <ErrorState message={error.message} />;

  // --- CSV exporters -------------------------------------------------------
  const exportRevenue = () =>
    downloadCsv("revenue-earnings-summary", [
      {
        revenue: liberty.revenue,
        libertyEarnings: liberty.libertyEarnings,
        sealCharges: liberty.sealCharges,
        serviceFees: liberty.serviceFees,
        outstanding: finance.outstanding,
        totalInvoiced: finance.totalInvoiced,
        totalCollected: finance.totalCollected,
        currency,
      },
    ]);

  const exportByStatus = () =>
    downloadCsv(
      "shipments-by-status",
      statusRows.map((r) => ({ status: r.label, count: r.count })),
    );

  const exportByCountry = () =>
    downloadCsv(
      "shipments-by-destination",
      byCountry.map((r) => ({ destinationCountry: r.country, count: r.count })),
    );

  const exportCommission = () =>
    downloadCsv(
      "commission-report",
      commissionRows.map((r) => ({
        invoiceNumber: r.invoice.invoiceNumber,
        customer: r.customer,
        route: r.route,
        sealCharge: r.sealCharge,
        libertyCommission: r.libertyCommission,
        platformFee: r.platformFee,
        libertyEarnings: r.libertyEarnings,
        currency: r.invoice.currency,
      })),
    );

  const exportReconciliation = () =>
    downloadCsv("weekly-reconciliation", [
      {
        totalShipments: reconciliation.totalShipments,
        customerPayments: reconciliation.customerPayments,
        sealCharges: reconciliation.sealCharges,
        libertyCommission: reconciliation.libertyCommission,
        pending: reconciliation.pending,
        disputed: reconciliation.disputed,
        completed: reconciliation.completed,
        currency,
      },
    ]);

  const exportBtn = (onClick: () => void) =>
    canExport ? (
      <Button variant="outline" size="sm" onClick={onClick}>
        <Download className="h-4 w-4" /> Export CSV
      </Button>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Revenue, commission and reconciliation across the pilot."
        actions={
          <Link href="/reports/pilot">
            <Button variant="secondary" size="sm">
              <Gauge className="h-4 w-4" /> Pilot Tracker
            </Button>
          </Link>
        }
      />

      {/* (a) Revenue & Earnings summary */}
      <Card>
        <CardHeader
          title="Revenue & Earnings"
          subtitle="Collected revenue and Liberty's commission position."
          action={exportBtn(exportRevenue)}
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Revenue Collected"
              value={formatMoney(liberty.revenue, currency)}
              icon="DollarSign"
              tone="emerald"
            />
            <StatCard
              label="Liberty Earnings"
              value={formatMoney(liberty.libertyEarnings, currency)}
              icon="TrendingUp"
              tone="gold"
            />
            <StatCard
              label="SEAL Charges"
              value={formatMoney(liberty.sealCharges, currency)}
              icon="Truck"
              tone="navy"
            />
            <StatCard
              label="Service Fees"
              value={formatMoney(liberty.serviceFees, currency)}
              icon="Receipt"
              tone="violet"
            />
            <StatCard
              label="Outstanding"
              value={formatMoney(finance.outstanding, currency)}
              icon="AlertTriangle"
              tone="amber"
              hint={`${liberty.pendingPayments} unpaid invoice(s)`}
            />
          </div>
        </CardBody>
      </Card>

      {/* (b) Shipments by status & by destination */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Shipments by Status"
            subtitle={`${formatNumber(shipments.length)} total`}
            action={exportBtn(exportByStatus)}
          />
          <CardBody>
            {statusRows.length === 0 ? (
              <EmptyState title="No shipments yet" />
            ) : (
              <ul className="space-y-2.5">
                {statusRows.map((r) => (
                  <li key={r.status} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 truncate text-sm text-navy-700">
                      {r.label}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{
                          width: `${maxStatusCount ? (r.count / maxStatusCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-navy-900">
                      {r.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Shipments by Destination"
            subtitle="Grouped by destination country."
            action={exportBtn(exportByCountry)}
          />
          <CardBody>
            {byCountry.length === 0 ? (
              <EmptyState title="No shipments yet" />
            ) : (
              <ul className="space-y-2.5">
                {byCountry.map((r) => (
                  <li key={r.country} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 truncate text-sm text-navy-700">
                      {r.country}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy-100">
                      <div
                        className="h-full rounded-full bg-gold-500"
                        style={{
                          width: `${maxCountryCount ? (r.count / maxCountryCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-navy-900">
                      {r.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* (c) Commission report */}
      <Card>
        <CardHeader
          title="Commission Report"
          subtitle="Per-invoice SEAL charge, Liberty commission and platform fee."
          action={exportBtn(exportCommission)}
        />
        <CardBody className="p-0">
          {commissionRows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={FileBarChart2}
                title="No invoices yet"
                description="Commission figures appear once invoices are generated."
              />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Invoice</TH>
                  <TH>Customer</TH>
                  <TH>Route</TH>
                  <TH className="text-right">SEAL Charge</TH>
                  <TH className="text-right">Liberty Commission</TH>
                  <TH className="text-right">Platform Fee</TH>
                  <TH className="text-right">Liberty Earnings</TH>
                </TR>
              </THead>
              <TBody>
                {commissionRows.map((r) => (
                  <TR key={r.invoice.id}>
                    <TD className="font-mono text-xs text-navy-600">
                      {r.invoice.invoiceNumber}
                    </TD>
                    <TD>{r.customer}</TD>
                    <TD className="font-mono text-xs">{r.route}</TD>
                    <TD className="text-right tabular-nums">
                      {formatMoney(r.sealCharge, r.invoice.currency)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatMoney(r.libertyCommission, r.invoice.currency)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatMoney(r.platformFee, r.invoice.currency)}
                    </TD>
                    <TD className="text-right font-semibold tabular-nums text-navy-900">
                      {formatMoney(r.libertyEarnings, r.invoice.currency)}
                    </TD>
                  </TR>
                ))}
                <TR className="bg-navy-50/60 font-semibold">
                  <TD>Totals</TD>
                  <TD />
                  <TD />
                  <TD className="text-right tabular-nums">
                    {formatMoney(commissionTotals.sealCharge, currency)}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {formatMoney(commissionTotals.libertyCommission, currency)}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {formatMoney(commissionTotals.platformFee, currency)}
                  </TD>
                  <TD className="text-right tabular-nums text-navy-900">
                    {formatMoney(commissionTotals.libertyEarnings, currency)}
                  </TD>
                </TR>
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* (d) Weekly reconciliation summary */}
      <Card>
        <CardHeader
          title="Weekly Reconciliation"
          subtitle="Snapshot for the Liberty ↔ SEAL settlement."
          action={exportBtn(exportReconciliation)}
        />
        <CardBody>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <ReconStat label="Total Shipments" value={formatNumber(reconciliation.totalShipments)} />
            <ReconStat
              label="Customer Payments"
              value={formatMoney(reconciliation.customerPayments, currency)}
            />
            <ReconStat
              label="SEAL Charges"
              value={formatMoney(reconciliation.sealCharges, currency)}
            />
            <ReconStat
              label="Liberty Commission"
              value={formatMoney(reconciliation.libertyCommission, currency)}
            />
            <ReconStat
              label="Pending"
              value={formatMoney(reconciliation.pending, currency)}
            />
            <ReconStat
              label="Disputed"
              value={
                <Badge tone={reconciliation.disputed > 0 ? "danger" : "neutral"}>
                  {reconciliation.disputed}
                </Badge>
              }
            />
            <ReconStat label="Completed" value={formatNumber(reconciliation.completed)} />
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}

function ReconStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-navy-100 bg-navy-50/40 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-navy-900">{value}</dd>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <RequirePermission permission="reports.view">
      <ReportsHub />
    </RequirePermission>
  );
}
