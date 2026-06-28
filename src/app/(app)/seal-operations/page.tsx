"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useShipments } from "@/lib/db/repositories/shipments";
import { useManifests } from "@/lib/db/repositories/manifests";
import { computeSealMetrics } from "@/lib/analytics/metrics";
import {
  PageHeader,
  Card,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  StatCard,
  StatusBadge,
  Tabs,
  InfoBanner,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import {
  SHIPMENT_STATUS_META,
  MANIFEST_STATUS_META,
} from "@/constants/statuses";
import type { Shipment, ShipmentStatus, SealHandlingStatus } from "@/types";
import { fromNow } from "@/lib/utils/dates";
import { formatWeight, titleCase } from "@/lib/utils/format";

type TabKey = "awaiting" | "received" | "in_transit" | "manifests";

const AWAITING_STATUSES: ShipmentStatus[] = ["draft", "awaiting_package"];
const RECEIVED_STATUSES: ShipmentStatus[] = [
  "received_by_seal",
  "inspected",
  "invoice_generated",
  "payment_pending",
  "payment_confirmed",
  "added_to_manifest",
  "ready_for_dispatch",
];
const IN_TRANSIT_STATUSES: ShipmentStatus[] = [
  "dispatched",
  "in_transit",
  "arrived_ghana",
  "customs_clearing",
  "ready_for_pickup",
  "out_for_delivery",
];

function sealHandlingLabel(status: SealHandlingStatus): string {
  return titleCase(status);
}

function SealHandlingBadge({ status }: { status: SealHandlingStatus }) {
  const tone =
    status === "intake_complete" || status === "manifested"
      ? "info"
      : status === "dispatched"
        ? "purple"
        : status === "delivered"
          ? "success"
          : status === "awaiting_intake"
            ? "warning"
            : "neutral";
  return (
    <StatusBadge
      meta={{ label: sealHandlingLabel(status), tone }}
      fallback={sealHandlingLabel(status)}
    />
  );
}

function ShipmentTable({ rows }: { rows: Shipment[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet"
        description="Shipments will appear in this view as they move through the SEAL pipeline."
      />
    );
  }
  return (
    <Card>
      <Table>
        <THead>
          <TR>
            <TH>Tracking</TH>
            <TH>Customer</TH>
            <TH>Route</TH>
            <TH>SEAL handling</TH>
            <TH>Status</TH>
            <TH>Weight</TH>
            <TH>Updated</TH>
          </TR>
        </THead>
        <TBody>
          {rows.map((s) => (
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
                <SealHandlingBadge status={s.sealHandlingStatus} />
              </TD>
              <TD>
                <StatusBadge meta={SHIPMENT_STATUS_META[s.status]} />
              </TD>
              <TD className="text-xs">{formatWeight(s.weightLb)}</TD>
              <TD className="text-xs text-navy-400">
                {fromNow(s.updatedAt ?? s.createdAt)}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

function SealOperationsInner() {
  const {
    data: shipments,
    loading: shipmentsLoading,
    error: shipmentsError,
  } = useShipments();
  const {
    data: manifests,
    loading: manifestsLoading,
    error: manifestsError,
  } = useManifests();

  const [tab, setTab] = useState<TabKey>("awaiting");

  const metrics = useMemo(
    () => computeSealMetrics(shipments, manifests),
    [shipments, manifests],
  );

  const buckets = useMemo(() => {
    const awaiting = shipments.filter(
      (s) =>
        AWAITING_STATUSES.includes(s.status) ||
        s.sealHandlingStatus === "awaiting_intake",
    );
    const received = shipments.filter(
      (s) =>
        RECEIVED_STATUSES.includes(s.status) &&
        !AWAITING_STATUSES.includes(s.status),
    );
    const inTransit = shipments.filter((s) =>
      IN_TRANSIT_STATUSES.includes(s.status),
    );
    return { awaiting, received, inTransit };
  }, [shipments]);

  const loading = shipmentsLoading || manifestsLoading;
  const error = shipmentsError || manifestsError;

  const tabs = [
    { key: "awaiting", label: "Awaiting Intake", count: buckets.awaiting.length },
    { key: "received", label: "Received", count: buckets.received.length },
    { key: "in_transit", label: "In Transit", count: buckets.inTransit.length },
    { key: "manifests", label: "Manifests", count: manifests.length },
  ];

  return (
    <div>
      <PageHeader
        title="SEAL Operations"
        description="Warehouse workspace for intake, manifesting and dispatch across the pilot."
      />

      <InfoBanner tone="info">
        <span className="inline-flex items-center gap-2 font-medium">
          <Lock className="h-4 w-4" /> Controlled access
        </span>{" "}
        SEAL operates within scoped permissions — you can receive, manifest and
        update shipments, but cannot delete records, change record ownership, or
        export customer data. These actions are reserved for Liberty.
      </InfoBanner>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Awaiting intake"
          value={metrics.awaitingIntake}
          icon="ClipboardList"
          tone="amber"
          href="/intake"
        />
        <StatCard
          label="Received"
          value={metrics.received}
          icon="PackageCheck"
          tone="emerald"
        />
        <StatCard
          label="Ready for dispatch"
          value={metrics.readyForDispatch}
          icon="Boxes"
          tone="gold"
          href="/manifests"
        />
        <StatCard
          label="Active manifests"
          value={metrics.activeManifests}
          icon="ClipboardCheck"
          tone="violet"
          href="/manifests"
        />
        <StatCard
          label="In transit"
          value={metrics.inTransit}
          icon="Truck"
          tone="brand"
        />
        <StatCard
          label="Delivered"
          value={metrics.delivered}
          icon="CheckCircle2"
          tone="emerald"
        />
        <StatCard
          label="Outstanding updates"
          value={metrics.outstandingUpdates}
          icon="BellRing"
          tone="red"
          hint="In-transit shipments needing a status update"
        />
      </div>

      <div className="mt-6">
        <Tabs tabs={tabs} active={tab} onChange={(k) => setTab(k as TabKey)} />

        <div className="mt-4">
          {loading ? (
            <LoadingState label="Loading SEAL operations…" />
          ) : error ? (
            <ErrorState message={error.message} />
          ) : tab === "manifests" ? (
            manifests.length === 0 ? (
              <EmptyState
                title="No manifests yet"
                description="Create a manifest from the manifests workspace to group packages for dispatch."
              />
            ) : (
              <Card>
                <Table>
                  <THead>
                    <TR>
                      <TH>Manifest</TH>
                      <TH>Route</TH>
                      <TH>Packages</TH>
                      <TH>Weight</TH>
                      <TH>Status</TH>
                      <TH>Updated</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {manifests.map((m) => (
                      <TR key={m.id}>
                        <TD>
                          <Link
                            href={`/manifests/${m.id}`}
                            className="font-mono text-xs font-medium text-brand-600 hover:underline"
                          >
                            {m.manifestNumber}
                          </Link>
                        </TD>
                        <TD className="text-xs">{m.routeCode}</TD>
                        <TD className="text-xs">{m.totalPackages}</TD>
                        <TD className="text-xs">{formatWeight(m.totalWeightLb)}</TD>
                        <TD>
                          <StatusBadge meta={MANIFEST_STATUS_META[m.status]} />
                        </TD>
                        <TD className="text-xs text-navy-400">
                          {fromNow(m.updatedAt ?? m.createdAt)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </Card>
            )
          ) : tab === "awaiting" ? (
            <ShipmentTable rows={buckets.awaiting} />
          ) : tab === "received" ? (
            <ShipmentTable rows={buckets.received} />
          ) : (
            <ShipmentTable rows={buckets.inTransit} />
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/intake"
          className="font-medium text-brand-600 hover:underline"
        >
          Go to Package Intake →
        </Link>
        <Link
          href="/manifests"
          className="font-medium text-brand-600 hover:underline"
        >
          Go to Manifests →
        </Link>
        <Link
          href="/shipments"
          className="font-medium text-brand-600 hover:underline"
        >
          View all Shipments →
        </Link>
      </div>
    </div>
  );
}

export default function SealOperationsPage() {
  return (
    <RequirePermission permission="seal.operate">
      <SealOperationsInner />
    </RequirePermission>
  );
}
