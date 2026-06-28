"use client";

import { ArrowLeftRight, Lock } from "lucide-react";
import type { CurrencyCode, Invoice, Payment } from "@/types";
import { formatMoney, round2 } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";

/**
 * Printable Liberty ⇄ SEAL settlement statement. Renders as a `.print-container`
 * so it prints cleanly (no shadow/border), matching the invoice document style.
 *
 * For the chosen period it reconciles what Liberty owes SEAL (operational/SEAL
 * charges) against what Liberty earns (commission + platform fee), and shows the
 * net position once collected customer payments are taken into account.
 *
 * Internal financial document — Liberty & Finance only, never customers or SEAL.
 */
export function SettlementDocument({
  invoices,
  payments,
  periodStart,
  periodEnd,
}: {
  invoices: Invoice[];
  payments: Payment[];
  periodStart: string;
  periodEnd: string;
}) {
  // Currency is taken from the data so the statement matches the invoices. The
  // pilot operates in a single currency, but we fall back gracefully.
  const currency: CurrencyCode =
    invoices.find((inv) => inv.commission)?.currency ?? invoices[0]?.currency ?? "USD";
  const money = (n: number) => formatMoney(n, currency);

  // Only invoices that carry a commission breakdown participate in settlement.
  const rows = invoices
    .filter((inv): inv is Invoice & { commission: NonNullable<Invoice["commission"]> } =>
      Boolean(inv.commission),
    )
    .map((inv) => ({ invoice: inv, commission: inv.commission }));

  const totals = rows.reduce(
    (t, { commission }) => ({
      sealCharge: round2(t.sealCharge + commission.sealCharge),
      serviceFee: round2(t.serviceFee + commission.serviceFee),
      libertyCommission: round2(t.libertyCommission + commission.libertyCommission),
      platformFee: round2(t.platformFee + commission.platformFee),
      libertyEarnings: round2(t.libertyEarnings + commission.libertyEarnings),
    }),
    { sealCharge: 0, serviceFee: 0, libertyCommission: 0, platformFee: 0, libertyEarnings: 0 },
  );

  const collectedInPeriod = round2(
    payments.reduce((sum, p) => sum + (Number.isFinite(p.amount) ? p.amount : 0), 0),
  );

  // Net cash position: customer payments collected this period minus what Liberty
  // must remit to SEAL for its operational charges.
  const netPosition = round2(collectedInPeriod - totals.sealCharge);
  const shipmentCount = rows.length;

  return (
    <div className="print-container rounded-xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-navy-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-navy-900">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Liberty Cargo Movers <ArrowLeftRight className="inline h-5 w-5 text-navy-400" /> SEAL
              Logistics
            </h1>
          </div>
          <p className="mt-1 text-sm font-medium text-navy-600">Settlement Statement</p>
          <p className="mt-0.5 text-xs text-navy-400">
            Internal reconciliation — Liberty &amp; Finance only.
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Period</p>
          <p className="text-sm font-semibold text-navy-900">
            {formatDate(periodStart)} – {formatDate(periodEnd)}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 sm:ml-auto">
            <Lock className="h-3.5 w-3.5" /> Confidential
          </div>
        </div>
      </div>

      {/* Per-invoice settlement table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="border-y border-navy-100 text-left text-xs uppercase tracking-wide text-navy-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Invoice #</th>
              <th className="px-3 py-2.5 font-medium">Tracking</th>
              <th className="px-3 py-2.5 font-medium">Customer</th>
              <th className="px-3 py-2.5 text-right font-medium">SEAL Charge</th>
              <th className="px-3 py-2.5 text-right font-medium">Service Fee</th>
              <th className="px-3 py-2.5 text-right font-medium">Liberty Commission</th>
              <th className="px-3 py-2.5 text-right font-medium">Platform Fee</th>
              <th className="px-3 py-2.5 text-right font-medium">Liberty Earnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-sm text-navy-400">
                  No invoiced shipments with a commission breakdown in this period.
                </td>
              </tr>
            ) : (
              rows.map(({ invoice, commission }) => (
                <tr key={invoice.id}>
                  <td className="whitespace-nowrap px-3 py-3 text-navy-700">
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-navy-600">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-navy-600">
                    {invoice.trackingNumber}
                  </td>
                  <td className="px-3 py-3 text-navy-800">{invoice.customerName}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-navy-800">
                    {money(commission.sealCharge)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-navy-700">
                    {money(commission.serviceFee)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-navy-700">
                    {money(commission.libertyCommission)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-navy-700">
                    {money(commission.platformFee)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-navy-900">
                    {money(commission.libertyEarnings)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-navy-200 bg-navy-50/60 font-semibold text-navy-900">
                <td className="px-3 py-3" colSpan={4}>
                  Totals — {shipmentCount} shipment{shipmentCount === 1 ? "" : "s"}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{money(totals.sealCharge)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{money(totals.serviceFee)}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {money(totals.libertyCommission)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{money(totals.platformFee)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{money(totals.libertyEarnings)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Settlement summary panel */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryStat
          label="SEAL operational charges"
          value={money(totals.sealCharge)}
          hint="Owed by Liberty to SEAL"
        />
        <SummaryStat label="Service fees" value={money(totals.serviceFee)} />
        <SummaryStat
          label="Liberty earnings"
          value={money(totals.libertyEarnings)}
          hint="Commission + platform fee"
          tone="emerald"
        />
        <SummaryStat label="Shipments settled" value={String(shipmentCount)} />
        <SummaryStat
          label="Payments collected (period)"
          value={money(collectedInPeriod)}
          hint="Customer payments received"
        />
        <SummaryStat
          label="Net position"
          value={money(netPosition)}
          hint="Collected − SEAL charges"
          tone={netPosition >= 0 ? "emerald" : "red"}
          emphasize
        />
      </div>

      <div className="mt-8 rounded-lg border border-violet-200 bg-violet-50/50 px-4 py-3 text-xs text-violet-700">
        This settlement reconciles Liberty&rsquo;s remittance to SEAL Logistics (operational charges)
        against Liberty&rsquo;s earnings (commission and platform fee) for the stated period of the
        6-month outsourcing pilot. Figures are sourced from each invoice&rsquo;s commission
        breakdown. Not visible to customers or SEAL.
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  tone = "navy",
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "navy" | "emerald" | "red";
  emphasize?: boolean;
}) {
  const valueTone =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "red"
        ? "text-red-600"
        : "text-navy-900";
  return (
    <div
      className={
        emphasize
          ? "rounded-lg border border-navy-200 bg-navy-50/60 p-4"
          : "rounded-lg border border-navy-100 bg-navy-50/40 p-4"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</p>
      <p className={`mt-1 ${emphasize ? "text-xl" : "text-lg"} font-bold ${valueTone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-navy-400">{hint}</p>}
    </div>
  );
}
