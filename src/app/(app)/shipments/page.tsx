"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Package } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isCustomer, isSeal } from "@/lib/auth/permissions";
import {
  useShipments,
  useCustomerShipments,
  useSealShipments,
} from "@/lib/db/repositories/shipments";
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
} from "@/components/ui";
import {
  SHIPMENT_STATUS_META,
  PAYMENT_STATUS_META,
} from "@/constants/statuses";
import type { Shipment, ShipmentStatus } from "@/types";
import { fromNow } from "@/lib/utils/dates";

type FilterKey = "all" | "active" | "delivered" | "issues";

const DELIVERED_STATUSES: ShipmentStatus[] = ["delivered"];
const ISSUE_STATUSES: ShipmentStatus[] = ["issue_reported", "cancelled"];

function statusGroup(status: ShipmentStatus): FilterKey {
  if (DELIVERED_STATUSES.includes(status)) return "delivered";
  if (ISSUE_STATUSES.includes(status)) return "issues";
  return "active";
}

export default function ShipmentsPage() {
  const router = useRouter();
  const { user, role, can } = useAuth();

  // Role-aware data source.
  const all = useShipments();
  const customerScoped = useCustomerShipments(isCustomer(role) ? user?.customerId : undefined);
  const sealScoped = useSealShipments(isSeal(role) ? user?.sealOffice : undefined);

  const { data, loading, error } = isCustomer(role)
    ? customerScoped
    : isSeal(role)
      ? sealScoped
      : all;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const c = { all: data.length, active: 0, delivered: 0, issues: 0 };
    for (const s of data) c[statusGroup(s.status)] += 1;
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((s) => {
      if (filter !== "all" && statusGroup(s.status) !== filter) return false;
      if (!q) return true;
      return (
        s.trackingNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.routeCode.toLowerCase().includes(q)
      );
    });
  }, [data, search, filter]);

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "delivered", label: "Delivered", count: counts.delivered },
    { key: "issues", label: "Issues", count: counts.issues },
  ];

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Track every package across the operations pipeline."
        actions={
          can("shipments.create") ? (
            <Link href="/shipments/new">
              <Button>
                <Plus className="h-4 w-4" /> New Shipment
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tracking, customer or route…"
          className="sm:max-w-xs"
        />
      </div>

      <Tabs tabs={tabs} active={filter} onChange={(k) => setFilter(k as FilterKey)} />

      <div className="mt-4">
        {loading ? (
          <LoadingState label="Loading shipments…" />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No shipments found"
            description={
              search || filter !== "all"
                ? "Try adjusting your search or filter."
                : "Shipments will appear here once created."
            }
            action={
              can("shipments.create") ? (
                <Link href="/shipments/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> New Shipment
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Tracking</TH>
                  <TH>Customer</TH>
                  <TH>Route</TH>
                  <TH>Status</TH>
                  <TH>Payment</TH>
                  <TH>Updated</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((s: Shipment) => (
                  <TR key={s.id} onClick={() => router.push(`/shipments/${s.id}`)}>
                    <TD>
                      <Link
                        href={`/shipments/${s.id}`}
                        className="font-mono text-xs font-medium text-brand-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {s.trackingNumber}
                      </Link>
                    </TD>
                    <TD className="font-medium text-navy-800">{s.customerName}</TD>
                    <TD className="text-xs">{s.routeCode}</TD>
                    <TD>
                      <StatusBadge meta={SHIPMENT_STATUS_META[s.status]} />
                    </TD>
                    <TD>
                      <StatusBadge meta={PAYMENT_STATUS_META[s.paymentStatus]} />
                    </TD>
                    <TD className="text-xs text-navy-400">{fromNow(s.updatedAt ?? s.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
