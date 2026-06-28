"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isSeal } from "@/lib/auth/permissions";
import { RequirePermission } from "@/components/auth/Guard";
import {
  useShipments,
  useSealShipments,
} from "@/lib/db/repositories/shipments";
import { usePlatformSettings } from "@/lib/db/repositories/settings";
import { IntakeForm } from "@/components/intake/IntakeForm";
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
  StatCard,
  StatusBadge,
  SearchInput,
  Modal,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { SHIPMENT_STATUS_META } from "@/constants/statuses";
import type { Shipment, ShipmentStatus } from "@/types";
import { fromNow } from "@/lib/utils/dates";
import { formatWeight } from "@/lib/utils/format";

/** Statuses where a package is still awaiting / undergoing SEAL intake. */
const INTAKE_QUEUE_STATUSES: ShipmentStatus[] = [
  "draft",
  "awaiting_package",
  "received_by_seal",
];

function needsIntake(s: Shipment): boolean {
  return (
    INTAKE_QUEUE_STATUSES.includes(s.status) &&
    s.sealHandlingStatus !== "intake_complete"
  );
}

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function IntakePageInner() {
  const { user, role } = useAuth();
  const { settings } = usePlatformSettings();

  const all = useShipments();
  const sealScoped = useSealShipments(isSeal(role) ? user?.sealOffice : undefined);
  const { data, loading, error } = isSeal(role) ? sealScoped : all;

  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Shipment | null>(null);

  const queue = useMemo(() => data.filter(needsIntake), [data]);

  const completed = useMemo(
    () =>
      data
        .filter((s) => s.sealHandlingStatus === "intake_complete")
        .slice(0, 12),
    [data],
  );

  const stats = useMemo(() => {
    const awaitingIntake = queue.length;
    const receivedToday = data.filter(
      (s) =>
        s.sealHandlingStatus === "intake_complete" &&
        isToday(s.updatedAt ?? s.createdAt),
    ).length;
    const ready = data.filter(
      (s) =>
        s.status === "ready_for_dispatch" || s.status === "added_to_manifest",
    ).length;
    return { awaitingIntake, receivedToday, ready };
  }, [data, queue]);

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter(
      (s) =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.routeCode.toLowerCase().includes(q),
    );
  }, [queue, search]);

  return (
    <div>
      <PageHeader
        title="Package Intake"
        description="Receive, photograph, weigh and inspect packages arriving at SEAL."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting intake"
          value={stats.awaitingIntake}
          icon="ClipboardList"
          tone="amber"
          hint="Packages still to be processed"
        />
        <StatCard
          label="Received today"
          value={stats.receivedToday}
          icon="PackageCheck"
          tone="emerald"
          hint="Intake completed today"
        />
        <StatCard
          label="Ready for dispatch"
          value={stats.ready}
          icon="Boxes"
          tone="gold"
          hint="Awaiting manifest / dispatch"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-navy-800">Intake queue</h2>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tracking or customer…"
          className="sm:max-w-xs"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading intake queue…" />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : filteredQueue.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="No packages awaiting intake"
          description={
            search
              ? "No queued packages match your search."
              : "New packages will appear here as they arrive at SEAL."
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
                <TH>Created</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {filteredQueue.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <Link
                      href={`/shipments/${s.id}`}
                      className="font-mono text-xs font-medium text-brand-600 hover:underline"
                    >
                      {s.trackingNumber}
                    </Link>
                  </TD>
                  <TD className="font-medium text-navy-800">{s.customerName}</TD>
                  <TD className="text-xs">{s.routeCode}</TD>
                  <TD>
                    <StatusBadge meta={SHIPMENT_STATUS_META[s.status]} />
                  </TD>
                  <TD className="text-xs text-navy-400">
                    {fromNow(s.createdAt)}
                  </TD>
                  <TD className="text-right">
                    <Button size="sm" onClick={() => setActive(s)}>
                      Start intake
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* Recently completed intakes */}
      {!loading && !error && completed.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-navy-800">
            Recently completed intakes
          </h2>
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Tracking</TH>
                  <TH>Customer</TH>
                  <TH>Weight</TH>
                  <TH>Status</TH>
                  <TH>Completed</TH>
                </TR>
              </THead>
              <TBody>
                {completed.map((s) => (
                  <TR key={s.id}>
                    <TD>
                      <Link
                        href={`/shipments/${s.id}`}
                        className="font-mono text-xs font-medium text-brand-600 hover:underline"
                      >
                        {s.trackingNumber}
                      </Link>
                    </TD>
                    <TD className="font-medium text-navy-800">{s.customerName}</TD>
                    <TD className="text-xs">{formatWeight(s.weightLb)}</TD>
                    <TD>
                      <StatusBadge meta={SHIPMENT_STATUS_META[s.status]} />
                    </TD>
                    <TD className="text-xs text-navy-400">
                      {fromNow(s.updatedAt ?? s.createdAt)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>
      )}

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title="Package intake"
        description={
          active ? `Inspecting ${active.trackingNumber}` : undefined
        }
        size="lg"
      >
        {active && (
          <IntakeForm
            shipment={active}
            settings={settings}
            onDone={() => setActive(null)}
          />
        )}
      </Modal>
    </div>
  );
}

export default function IntakePage() {
  return (
    <RequirePermission permission="intake.manage">
      <IntakePageInner />
    </RequirePermission>
  );
}
