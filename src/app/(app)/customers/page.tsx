"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, Upload, Download } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCustomers } from "@/lib/db/repositories/customers";
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
  Badge,
  SearchInput,
  Tabs,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from "@/components/ui";
import { downloadCsv } from "@/components/payments/csv";
import { formatMoney } from "@/lib/utils/format";
import { todayISODate } from "@/lib/utils/dates";
import { CUSTOMER_TYPE_LABELS, CUSTOMER_SOURCE_LABELS } from "@/constants/statuses";
import type { BadgeTone } from "@/constants/statuses";
import type { CustomerSource } from "@/types";

const SOURCE_TONE: Record<CustomerSource, BadgeTone> = {
  liberty: "info",
  seal: "purple",
  referral: "gold",
  walk_in: "neutral",
  online: "success",
  campaign: "warning",
};

const TYPE_TONE: BadgeTone = "neutral";

export default function CustomersPage() {
  return (
    <RequirePermission permission="customers.view">
      <CustomersList />
    </RequirePermission>
  );
}

function CustomersList() {
  const router = useRouter();
  const { can } = useAuth();
  const { success, error: toastError } = useToast();
  const { data: customers, loading, error } = useCustomers();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<string>("all");

  const sources = Object.keys(CUSTOMER_SOURCE_LABELS) as CustomerSource[];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (source !== "all" && c.source !== source) return false;
      if (!q) return true;
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [customers, search, source]);

  const tabs = useMemo(
    () => [
      { key: "all", label: "All", count: customers.length },
      ...sources.map((s) => ({
        key: s,
        label: CUSTOMER_SOURCE_LABELS[s],
        count: customers.filter((c) => c.source === s).length,
      })),
    ],
    [customers, sources],
  );

  /** Export the currently-filtered customers to CSV (admins only). */
  function handleExport() {
    if (filtered.length === 0) {
      toastError("No customers to export.");
      return;
    }
    const rows = filtered.map((c) => ({
      code: c.customerCode,
      name: c.fullName,
      phone: c.phone,
      email: c.email ?? "",
      country: c.country,
      city: c.city ?? "",
      type: CUSTOMER_TYPE_LABELS[c.customerType],
      source: CUSTOMER_SOURCE_LABELS[c.source],
      shipments: c.shipmentCount,
      totalSpend: c.totalSpend,
    }));
    downloadCsv(`customers-${todayISODate()}.csv`, rows);
    success(`Exported ${rows.length} customer${rows.length === 1 ? "" : "s"}.`);
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="People and organisations shipping with Liberty & Liberty Logistics."
        actions={
          <>
            {can("data.export") && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            )}
            {can("customers.create") && (
              <>
                <Link href="/customers/import">
                  <Button variant="outline">
                    <Upload className="h-4 w-4" /> Import CSV
                  </Button>
                </Link>
                <Link href="/customers/new">
                  <Button>
                    <Plus className="h-4 w-4" /> Add Customer
                  </Button>
                </Link>
              </>
            )}
          </>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone, code or email…"
        />
      </div>

      <div className="mb-4">
        <Tabs tabs={tabs} active={source} onChange={setSource} />
      </div>

      {loading ? (
        <LoadingState label="Loading customers…" />
      ) : error ? (
        <ErrorState message="Failed to load customers." />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start creating shipments."
          action={
            can("customers.create") ? (
              <Link href="/customers/new">
                <Button>
                  <Plus className="h-4 w-4" /> Add Customer
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No matching customers"
          description="Try a different search term or filter."
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Code</TH>
                <TH>Name</TH>
                <TH>Phone</TH>
                <TH>Country</TH>
                <TH>Type</TH>
                <TH>Source</TH>
                <TH className="text-right">Shipments</TH>
                <TH className="text-right">Total Spend</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((c) => (
                <TR key={c.id} onClick={() => router.push(`/customers/${c.id}`)}>
                  <TD className="font-mono text-xs font-medium text-brand-600">{c.customerCode}</TD>
                  <TD className="font-medium text-navy-800">{c.fullName}</TD>
                  <TD className="text-navy-600">{c.phone}</TD>
                  <TD className="text-navy-600">{c.country}</TD>
                  <TD>
                    <Badge tone={TYPE_TONE}>{CUSTOMER_TYPE_LABELS[c.customerType]}</Badge>
                  </TD>
                  <TD>
                    <Badge tone={SOURCE_TONE[c.source]}>{CUSTOMER_SOURCE_LABELS[c.source]}</Badge>
                  </TD>
                  <TD className="text-right font-medium text-navy-800">{c.shipmentCount}</TD>
                  <TD className="text-right font-medium text-navy-800">{formatMoney(c.totalSpend)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
