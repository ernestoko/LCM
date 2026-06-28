"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Package, Layers, X } from "lucide-react";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { isCustomer, isSeal } from "@/lib/auth/permissions";
import {
  useShipments,
  useCustomerShipments,
  useSealShipments,
  consolidateShipments,
  isConsolidatable,
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
  Checkbox,
  StatusBadge,
  SearchInput,
  Tabs,
  Modal,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from "@/components/ui";
import { SHIPMENT_STATUS_META, PAYMENT_STATUS_META } from "@/constants/statuses";
import type { Shipment, ShipmentStatus } from "@/types";
import { fromNow } from "@/lib/utils/dates";
import { formatWeight } from "@/lib/utils/format";

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
  const actor = useActor();
  const { success, error: toastError } = useToast();

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canConsolidate = can("shipments.create");

  // Merged source packages are hidden — the consolidated parent represents them.
  const visible = useMemo(() => data.filter((s) => s.status !== "consolidated"), [data]);

  const counts = useMemo(() => {
    const c = { all: visible.length, active: 0, delivered: 0, issues: 0 };
    for (const s of visible) c[statusGroup(s.status)] += 1;
    return c;
  }, [visible]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible.filter((s) => {
      if (filter !== "all" && statusGroup(s.status) !== filter) return false;
      if (!q) return true;
      return (
        s.trackingNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.routeCode.toLowerCase().includes(q)
      );
    });
  }, [visible, search, filter]);

  const selectedShipments = useMemo(
    () => visible.filter((s) => selected.has(s.id)),
    [visible, selected],
  );

  // Validate the current selection for consolidation.
  const consolidation = useMemo(() => {
    if (selectedShipments.length < 2) return { ok: false as const, reason: "Select 2 or more packages" };
    const first = selectedShipments[0];
    if (selectedShipments.some((s) => s.customerId !== first.customerId))
      return { ok: false as const, reason: "Packages must be from the same customer" };
    if (selectedShipments.some((s) => s.routeCode !== first.routeCode))
      return { ok: false as const, reason: "Packages must share the same route" };
    if (selectedShipments.some((s) => !isConsolidatable(s)))
      return { ok: false as const, reason: "Some packages can't be consolidated" };
    return {
      ok: true as const,
      reason: "",
      customer: first.customerName,
      route: first.routeCode,
      pieces: selectedShipments.reduce((n, s) => n + (s.pieces ?? 1), 0),
      weight: selectedShipments.reduce((w, s) => w + (s.weightLb ?? 0), 0),
    };
  }, [selectedShipments]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConsolidate() {
    setBusy(true);
    try {
      const result = await consolidateShipments(selectedShipments, actor);
      success(`Consolidated ${selectedShipments.length} packages into ${result.consolidationNumber}.`);
      setSelected(new Set());
      setConfirmOpen(false);
      router.push(`/shipments/${result.id}`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Couldn't consolidate these packages.");
    } finally {
      setBusy(false);
    }
  }

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
        {canConsolidate && (
          <p className="text-xs text-navy-400">
            Tip: tick two or more pre-invoice packages from the same customer to consolidate them.
          </p>
        )}
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
                  {canConsolidate && <TH className="w-10" />}
                  <TH>Tracking</TH>
                  <TH>Customer</TH>
                  <TH>Route</TH>
                  <TH>Status</TH>
                  <TH>Payment</TH>
                  <TH>Updated</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((s: Shipment) => {
                  const selectable = canConsolidate && isConsolidatable(s);
                  return (
                    <TR key={s.id} onClick={() => router.push(`/shipments/${s.id}`)}>
                      {canConsolidate && (
                        <TD>
                          <span className="flex" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selected.has(s.id)}
                              disabled={!selectable}
                              onChange={() => toggle(s.id)}
                              aria-label={`Select ${s.trackingNumber}`}
                            />
                          </span>
                        </TD>
                      )}
                      <TD>
                        <Link
                          href={`/shipments/${s.id}`}
                          className="font-mono text-xs font-medium text-brand-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {s.trackingNumber}
                        </Link>
                        {s.isConsolidated && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            <Layers className="h-3 w-3" /> {s.consolidationNumber}
                          </span>
                        )}
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
                  );
                })}
              </TBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Floating consolidation bar */}
      {canConsolidate && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <div className="flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-navy-100 bg-white p-3 shadow-card-hover">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Layers className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy-900">
                {selected.size} package{selected.size === 1 ? "" : "s"} selected
              </p>
              <p className="truncate text-xs text-navy-500">
                {consolidation.ok
                  ? `${consolidation.customer} · ${consolidation.route} · ${consolidation.pieces} boxes`
                  : consolidation.reason}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              <X className="h-4 w-4" /> Clear
            </Button>
            <Button size="sm" disabled={!consolidation.ok} onClick={() => setConfirmOpen(true)}>
              <Layers className="h-4 w-4" /> Consolidate
            </Button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Consolidate packages"
        description="Merge these packages into one shipment with a single invoice."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleConsolidate} loading={busy} disabled={!consolidation.ok}>
              <Layers className="h-4 w-4" /> Consolidate {selectedShipments.length}
            </Button>
          </>
        }
      >
        {consolidation.ok ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-navy-100 bg-navy-50/50 p-3 text-center">
              <Stat label="Customer" value={consolidation.customer} />
              <Stat label="Route" value={consolidation.route} />
              <Stat label="Total boxes" value={String(consolidation.pieces)} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">
                Packages to merge
              </p>
              <ul className="space-y-1.5">
                {selectedShipments.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-navy-100 px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-navy-700">{s.trackingNumber}</span>
                    <span className="text-xs text-navy-500">
                      {s.pieces ?? 1} box{(s.pieces ?? 1) === 1 ? "" : "es"} · {formatWeight(s.weightLb)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-navy-500">
              A new consolidated shipment is created with the combined contents; these packages are
              linked to it and a single invoice will cover them all.
            </p>
          </div>
        ) : (
          <p className="text-sm text-navy-600">{consolidation.reason}.</p>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-navy-900">{value}</p>
    </div>
  );
}
