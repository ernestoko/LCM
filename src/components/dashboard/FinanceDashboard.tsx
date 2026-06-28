"use client";

import Link from "next/link";
import { useInvoices } from "@/lib/db/repositories/invoices";
import { usePayments } from "@/lib/db/repositories/payments";
import { computeFinanceMetrics } from "@/lib/analytics/metrics";
import { StatCard, Card, CardHeader, Table, THead, TH, TBody, TR, TD, StatusBadge } from "@/components/ui";
import { formatMoney } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { PAYMENT_STATUS_META } from "@/constants/statuses";

export function FinanceDashboard() {
  const { data: invoices } = useInvoices();
  const { data: payments } = usePayments();
  const m = computeFinanceMetrics(invoices, payments);
  const outstanding = invoices.filter((i) => i.balanceDue > 0).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Invoiced" value={formatMoney(m.totalInvoiced)} icon="FileText" tone="brand" href="/invoices" />
        <StatCard label="Collected" value={formatMoney(m.totalCollected)} icon="Wallet" tone="emerald" href="/payments" />
        <StatCard label="Outstanding" value={formatMoney(m.outstanding)} icon="CircleAlert" tone="red" />
        <StatCard label="Operations Payable" value={formatMoney(m.sealPayable)} icon="Building2" tone="violet" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Liberty Commission" value={formatMoney(m.libertyCommission)} icon="TrendingUp" tone="gold" />
        <StatCard label="Unreconciled" value={m.unreconciled} icon="Scale" tone="amber" href="/payments" />
        <StatCard label="Disputed" value={m.disputed} icon="TriangleAlert" tone="red" />
        <StatCard label="Reconciliation" value={`${reconciledPct(payments)}%`} icon="CircleCheck" tone="emerald" />
      </div>

      <Card>
        <CardHeader
          title="Outstanding invoices"
          action={
            <Link href="/invoices" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          }
        />
        {outstanding.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-navy-400">No outstanding invoices. 🎉</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Invoice</TH>
                <TH>Customer</TH>
                <TH>Total</TH>
                <TH>Balance</TH>
                <TH>Status</TH>
                <TH>Date</TH>
              </TR>
            </THead>
            <TBody>
              {outstanding.map((i) => (
                <TR key={i.id}>
                  <TD>
                    <Link href={`/invoices/${i.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">
                      {i.invoiceNumber}
                    </Link>
                  </TD>
                  <TD className="font-medium text-navy-800">{i.customerName}</TD>
                  <TD>{formatMoney(i.total, i.currency)}</TD>
                  <TD className="font-semibold text-red-600">{formatMoney(i.balanceDue, i.currency)}</TD>
                  <TD>
                    <StatusBadge meta={PAYMENT_STATUS_META[i.paymentStatus]} />
                  </TD>
                  <TD className="text-xs text-navy-400">{formatDate(i.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function reconciledPct(payments: { reconciliationStatus: string }[]): number {
  if (payments.length === 0) return 100;
  const done = payments.filter((p) => p.reconciliationStatus === "reconciled").length;
  return Math.round((done / payments.length) * 100);
}
