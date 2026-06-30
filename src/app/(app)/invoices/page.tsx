"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Download } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isCustomer } from "@/lib/auth/permissions";
import { useInvoices, useCustomerInvoices } from "@/lib/db/repositories/invoices";
import {
  PageHeader,
  Button,
  Card,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  StatusBadge,
  SearchInput,
  Tabs,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from "@/components/ui";
import { downloadCsv } from "@/components/payments/csv";
import { PAYMENT_STATUS_META } from "@/constants/statuses";
import { formatMoney } from "@/lib/utils/format";
import { formatDate, todayISODate } from "@/lib/utils/dates";
import type { Invoice, PaymentStatus } from "@/types";

type FilterKey = "all" | "unpaid" | "partial" | "paid";

function statusGroup(status: PaymentStatus): FilterKey {
  if (status === "unpaid") return "unpaid";
  if (status === "partial") return "partial";
  // paid / confirmed / refunded all count as settled for the simple list filter.
  return "paid";
}

export default function InvoicesPage() {
  const router = useRouter();
  const { user, role, can } = useAuth();
  const { success, error: toastError } = useToast();

  // Role-aware data source. Customers only see their own invoices
  // (permission `invoices.view.own`); staff/finance see all (`invoices.view`).
  const customerScoped = useCustomerInvoices(isCustomer(role) ? user?.customerId : undefined);
  const allInvoices = useInvoices();
  const { data, loading, error } = isCustomer(role) ? customerScoped : allInvoices;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const c = { all: data.length, unpaid: 0, partial: 0, paid: 0 };
    for (const inv of data) c[statusGroup(inv.paymentStatus)] += 1;
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((inv) => {
      if (filter !== "all" && statusGroup(inv.paymentStatus) !== filter) return false;
      if (!q) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.trackingNumber.toLowerCase().includes(q)
      );
    });
  }, [data, search, filter]);

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "unpaid", label: "Unpaid", count: counts.unpaid },
    { key: "partial", label: "Partial", count: counts.partial },
    { key: "paid", label: "Paid", count: counts.paid },
  ];

  /** Export the currently-filtered invoices to CSV (admins only). */
  function handleExport() {
    if (filtered.length === 0) {
      toastError("No invoices to export.");
      return;
    }
    const rows = filtered.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customerName,
      trackingNumber: inv.trackingNumber,
      route: inv.routeCode,
      currency: inv.currency,
      total: inv.total,
      amountPaid: inv.amountPaid,
      balanceDue: inv.balanceDue,
      paymentStatus: PAYMENT_STATUS_META[inv.paymentStatus]?.label ?? inv.paymentStatus,
      date: formatDate(inv.createdAt),
    }));
    downloadCsv(`invoices-${todayISODate()}.csv`, rows);
    success(`Exported ${rows.length} invoice${rows.length === 1 ? "" : "s"}.`);
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={
          isCustomer(role)
            ? "Your invoices and balances."
            : "Invoices generated from our approved rate card."
        }
        actions={
          can("data.export") && !isCustomer(role) ? (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search invoice #, customer or tracking…"
        />
      </div>

      <div className="mb-4">
        <Tabs tabs={tabs} active={filter} onChange={(k) => setFilter(k as FilterKey)} />
      </div>

      {loading ? (
        <LoadingState label="Loading invoices…" />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={
            search || filter !== "all"
              ? "Try adjusting your search or filter."
              : "Invoices appear here once generated from a shipment."
          }
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Invoice #</TH>
                <TH>Customer</TH>
                <TH>Tracking</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-right">Balance</TH>
                <TH>Status</TH>
                <TH>Date</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((inv: Invoice) => (
                <TR key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}>
                  <TD>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-mono text-xs font-medium text-brand-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </TD>
                  <TD className="font-medium text-navy-800">{inv.customerName}</TD>
                  <TD className="font-mono text-xs text-navy-600">{inv.trackingNumber}</TD>
                  <TD className="text-right font-medium text-navy-800">
                    {formatMoney(inv.total, inv.currency)}
                  </TD>
                  <TD
                    className={
                      inv.balanceDue > 0
                        ? "text-right font-semibold text-red-600"
                        : "text-right font-medium text-navy-600"
                    }
                  >
                    {formatMoney(inv.balanceDue, inv.currency)}
                  </TD>
                  <TD>
                    <StatusBadge
                      meta={PAYMENT_STATUS_META[inv.paymentStatus]}
                      fallback={inv.paymentStatus}
                    />
                  </TD>
                  <TD className="text-xs text-navy-400">{formatDate(inv.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
