"use client";

import type { Customer, Shipment, Invoice, Payment, CurrencyCode } from "@/types";
import { StatusBadge } from "@/components/ui";
import { SHIPMENT_STATUS_META, PAYMENT_METHOD_LABELS } from "@/constants/statuses";
import { formatMoney } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";

/**
 * Printable customer account statement (ledger). Renders as a `.print-container`
 * so it prints cleanly (no shadow/border), matching the InvoiceDocument style.
 *
 * The ledger merges invoices (debits — increase the balance) and payments
 * (credits — decrease the balance) into a single chronological list, then walks
 * it forward to compute a running balance. Finance and customers use this to see
 * all activity and the amount currently owed.
 */
export function StatementDocument({
  customer,
  shipments,
  invoices,
  payments,
}: {
  customer: Customer;
  shipments: Shipment[];
  invoices: Invoice[];
  payments: Payment[];
}) {
  // Pick a single display currency: prefer an invoice's, else a payment's, else USD.
  const currency: CurrencyCode = invoices[0]?.currency ?? payments[0]?.currency ?? "USD";
  const money = (n: number) => formatMoney(n, currency);

  // --- Build the chronological ledger ------------------------------------
  type LedgerRow = {
    id: string;
    date: string;
    description: string;
    reference: string;
    debit: number; // invoice total — increases balance
    credit: number; // payment amount — decreases balance
    balance: number; // running balance after this row
  };

  const invoiceEntries = invoices.map((inv) => ({
    sortDate: inv.createdAt,
    row: {
      id: `inv-${inv.id}`,
      date: inv.createdAt,
      description: `Invoice ${inv.invoiceNumber}`,
      reference: inv.trackingNumber,
      debit: inv.total ?? 0,
      credit: 0,
    },
  }));

  const paymentEntries = payments.map((pay) => ({
    sortDate: pay.paymentDate ?? pay.createdAt,
    row: {
      id: `pay-${pay.id}`,
      date: pay.paymentDate ?? pay.createdAt,
      description: `Receipt ${pay.receiptNumber} · ${PAYMENT_METHOD_LABELS[pay.method] ?? pay.method}`,
      reference: pay.invoiceNumber,
      debit: 0,
      credit: pay.amount ?? 0,
    },
  }));

  const sorted = [...invoiceEntries, ...paymentEntries].sort(
    (a, b) => new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime(),
  );

  let running = 0;
  const ledger: LedgerRow[] = sorted.map((entry) => {
    running += entry.row.debit - entry.row.credit;
    return { ...entry.row, balance: running };
  });

  // --- Summary panel figures ---------------------------------------------
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);
  const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount ?? 0), 0);
  const currentBalance = totalInvoiced - totalPaid;
  const shipmentCount = shipments.length;

  const statementDate = new Date().toISOString();

  return (
    <div className="print-container rounded-xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-navy-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">
            Liberty &amp; Liberty Logistics
          </h1>
          <p className="mt-1 text-sm font-medium text-navy-600">Account Statement</p>
          <p className="mt-0.5 text-xs text-navy-400">Logistics &amp; Freight Forwarding</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-400">
            Statement date
          </p>
          <p className="mt-1 text-sm font-semibold text-navy-900">{formatDate(statementDate)}</p>
        </div>
      </div>

      {/* Customer meta */}
      <div className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Customer</p>
          <p className="mt-1 text-sm font-semibold text-navy-900">{customer.fullName}</p>
          <p className="mt-1 font-mono text-xs font-medium text-navy-600">
            {customer.customerCode}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Contact</p>
          <p className="mt-1 text-sm text-navy-800">{customer.phone}</p>
          {customer.email && <p className="mt-0.5 text-sm text-navy-600">{customer.email}</p>}
          {(customer.city || customer.country) && (
            <p className="mt-0.5 text-sm text-navy-600">
              {[customer.city, customer.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Summary panel */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-navy-100 bg-navy-50/60 p-4 sm:grid-cols-4">
        <SummaryStat label="Total invoiced" value={money(totalInvoiced)} />
        <SummaryStat label="Total paid" value={money(totalPaid)} />
        <SummaryStat
          label="Balance due"
          value={money(currentBalance)}
          valueClass={currentBalance > 0 ? "text-red-600" : "text-emerald-600"}
        />
        <SummaryStat label="Shipments" value={String(shipmentCount)} />
      </div>

      {/* Ledger */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
          Account activity
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="border-y border-navy-100 text-left text-xs uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 text-right font-medium">Debit</th>
                <th className="px-3 py-2.5 text-right font-medium">Credit</th>
                <th className="px-3 py-2.5 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-sm text-navy-400">
                    No account activity on record.
                  </td>
                </tr>
              ) : (
                ledger.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-3 py-3 text-navy-500">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-3 py-3 text-navy-800">
                      <span className="font-medium">{row.description}</span>
                      {row.reference && (
                        <span className="ml-1.5 font-mono text-xs text-navy-400">
                          {row.reference}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-navy-700">
                      {row.debit > 0 ? money(row.debit) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700">
                      {row.credit > 0 ? money(row.credit) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-navy-900">
                      {money(row.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {ledger.length > 0 && (
              <tfoot className="border-t border-navy-200 text-sm font-semibold">
                <tr>
                  <td className="px-3 py-3 text-navy-700" colSpan={2}>
                    Current balance due
                  </td>
                  <td className="px-3 py-3 text-right text-navy-500">{money(totalInvoiced)}</td>
                  <td className="px-3 py-3 text-right text-emerald-700">{money(totalPaid)}</td>
                  <td
                    className={
                      "px-3 py-3 text-right " +
                      (currentBalance > 0 ? "text-red-600" : "text-emerald-600")
                    }
                  >
                    {money(currentBalance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Shipments overview */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
          Shipments overview
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="border-y border-navy-100 text-left text-xs uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Tracking</th>
                <th className="px-3 py-2.5 font-medium">Route</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-navy-400">
                    No shipments on record.
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-3 font-mono text-xs font-medium text-navy-800">
                      {s.trackingNumber}
                    </td>
                    <td className="px-3 py-3 text-navy-700">{s.routeCode}</td>
                    <td className="px-3 py-3">
                      <StatusBadge meta={SHIPMENT_STATUS_META[s.status]} fallback={s.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-xs text-navy-400">
                      {formatDate(s.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 border-t border-navy-100 pt-4 text-center text-xs text-navy-400">
        This statement reflects all invoices and payments on record as of{" "}
        {formatDate(statementDate)}. Thank you for shipping with Liberty &amp; Liberty Logistics.
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</p>
      <p className={"mt-1 text-lg font-bold text-navy-900 " + (valueClass ?? "")}>{value}</p>
    </div>
  );
}
