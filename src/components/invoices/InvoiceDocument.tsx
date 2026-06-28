"use client";

import { Lock } from "lucide-react";
import type { Invoice } from "@/types";
import { StatusBadge } from "@/components/ui";
import { PAYMENT_STATUS_META } from "@/constants/statuses";
import { formatMoney } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";

/**
 * Printable invoice document. Renders as a `.print-container` so it prints
 * cleanly (no shadow/border). The commission / SEAL-settlement breakdown is
 * gated behind `showCommission` and must only be shown to Liberty & Finance —
 * never to customers or SEAL.
 */
export function InvoiceDocument({
  invoice,
  showCommission = false,
}: {
  invoice: Invoice;
  showCommission?: boolean;
}) {
  const currency = invoice.currency;
  const money = (n: number) => formatMoney(n, currency);
  const balanceDue = invoice.balanceDue ?? Math.max(0, invoice.total - (invoice.amountPaid ?? 0));

  return (
    <div className="space-y-6">
      <div className="print-container rounded-xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-navy-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">Liberty Cargo Movers</h1>
            <p className="mt-1 text-sm text-navy-500">Logistics &amp; Freight Forwarding</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Invoice</p>
            <p className="font-mono text-lg font-semibold text-navy-900">{invoice.invoiceNumber}</p>
            <p className="mt-1 text-sm text-navy-500">{formatDate(invoice.createdAt)}</p>
            <div className="mt-2 flex sm:justify-end">
              <StatusBadge
                meta={PAYMENT_STATUS_META[invoice.paymentStatus]}
                fallback={invoice.paymentStatus}
              />
            </div>
          </div>
        </div>

        {/* Bill-to / shipment meta */}
        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Billed to</p>
            <p className="mt-1 text-sm font-semibold text-navy-900">{invoice.customerName}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Tracking</p>
            <p className="mt-1 font-mono text-sm font-medium text-navy-800">{invoice.trackingNumber}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-navy-400">Route</p>
            <p className="mt-1 text-sm text-navy-800">{invoice.routeCode}</p>
          </div>
        </div>

        {/* Lines */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="border-y border-navy-100 text-left text-xs uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 text-right font-medium">Qty</th>
                <th className="px-3 py-2.5 text-right font-medium">Unit Price</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {invoice.lines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-navy-400">
                    No line items.
                  </td>
                </tr>
              ) : (
                invoice.lines.map((line, i) => (
                  <tr key={i}>
                    <td className="px-3 py-3 text-navy-800">{line.description}</td>
                    <td className="px-3 py-3 text-right text-navy-700">{line.quantity}</td>
                    <td className="px-3 py-3 text-right text-navy-700">{money(line.unitPrice)}</td>
                    <td className="px-3 py-3 text-right font-medium text-navy-900">{money(line.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <Row label="Subtotal" value={money(invoice.subtotal)} />
            <Row label="Service fee" value={money(invoice.serviceFee)} />
            <Row label="Additional charges" value={money(invoice.additionalCharges)} />
            <div className="flex items-center justify-between border-t border-navy-200 pt-2 text-base font-bold text-navy-900">
              <dt>Total</dt>
              <dd>{money(invoice.total)}</dd>
            </div>
            <Row label="Amount paid" value={money(invoice.amountPaid)} />
            <div className="flex items-center justify-between border-t border-navy-100 pt-2 text-base font-semibold">
              <dt className="text-navy-700">Balance due</dt>
              <dd className={balanceDue > 0 ? "text-red-600" : "text-emerald-600"}>{money(balanceDue)}</dd>
            </div>
          </dl>
        </div>

        {/* Rate-card note */}
        <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Pricing is based on SEAL Logistics&rsquo; approved rate card (
          <span className="font-medium">{invoice.rateCardName}</span>, effective{" "}
          {formatDate(invoice.rateCardEffectiveDate)}) for the 6-month outsourcing period.
        </div>

        {/* Payment instructions */}
        {invoice.paymentInstructions && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Payment instructions</p>
            <p className="mt-1 whitespace-pre-line text-sm text-navy-700">{invoice.paymentInstructions}</p>
          </div>
        )}

        {invoice.notes && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Notes</p>
            <p className="mt-1 whitespace-pre-line text-sm text-navy-700">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-6 border-t border-navy-100 pt-4 text-center text-xs text-navy-400">
          Thank you for shipping with Liberty Cargo Movers.
        </div>
      </div>

      {/* Internal commission / SEAL-settlement card — Liberty & Finance only. */}
      {showCommission && invoice.commission && (
        <div className="no-print rounded-xl border border-violet-200 bg-violet-50/50 p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-violet-900">Internal — Liberty/SEAL settlement</h2>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="SEAL charge" value={money(invoice.commission.sealCharge)} />
            <Metric label="Service fee" value={money(invoice.commission.serviceFee)} />
            <Metric label="Liberty commission" value={money(invoice.commission.libertyCommission)} />
            <Metric label="Platform fee" value={money(invoice.commission.platformFee)} />
            <Metric
              label="Liberty earnings"
              value={money(invoice.commission.libertyEarnings)}
              emphasize
            />
          </dl>
          {invoice.commission.basis && (
            <p className="mt-4 border-t border-violet-200 pt-3 text-xs text-violet-700">
              {invoice.commission.basis}
            </p>
          )}
          <p className="mt-3 text-xs font-medium text-violet-500">
            Not visible to customers or SEAL.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-navy-600">
      <dt>{label}</dt>
      <dd className="text-navy-800">{value}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-violet-500">{label}</dt>
      <dd
        className={
          emphasize
            ? "mt-0.5 text-lg font-bold text-violet-900"
            : "mt-0.5 text-sm font-semibold text-violet-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}
