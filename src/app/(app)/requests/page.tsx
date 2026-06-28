"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  Warehouse,
  Inbox,
  Plus,
  ArrowRight,
  PackageCheck,
  X,
} from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { isCustomer } from "@/lib/auth/permissions";
import {
  useRequests,
  useCustomerRequests,
  updateRequestStatus,
  cancelRequest,
  convertRequestToShipment,
} from "@/lib/db/repositories/requests";
import {
  PageHeader,
  Card,
  CardBody,
  Button,
  Badge,
  StatusBadge,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  Modal,
  Tabs,
  LoadingState,
  ErrorState,
  EmptyState,
  KeyValue,
  useToast,
} from "@/components/ui";
import { REQUEST_STATUS_META, REQUEST_TYPE_LABELS } from "@/constants/statuses";
import { formatDate } from "@/lib/utils/dates";
import type { ShipmentRequest, RequestStatus } from "@/types";

const CANCELLABLE: RequestStatus[] = ["submitted", "in_review", "scheduled"];

export default function RequestsPage() {
  return (
    <RequirePermission anyOf={["requests.view.own", "requests.view"]}>
      <RequestsRouter />
    </RequirePermission>
  );
}

function RequestsRouter() {
  const { role } = useAuth();
  return isCustomer(role) ? <CustomerRequests /> : <StaffRequests />;
}

/* ----------------------------- Customer view ----------------------------- */

function CustomerRequests() {
  const { user } = useAuth();
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const { data, loading, error } = useCustomerRequests(user?.customerId);
  const [busy, setBusy] = useState<string | null>(null);

  async function handleCancel(req: ShipmentRequest) {
    setBusy(req.id);
    try {
      await cancelRequest(req.id, actor);
      success(`Request ${req.requestNumber} cancelled.`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Couldn't cancel the request.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="My Requests"
        description="Pickups and warehouse pre-alerts you've sent us."
        actions={
          <div className="flex gap-2">
            <Link href="/request/pickup"><Button variant="outline"><Truck className="h-4 w-4" /> Pickup</Button></Link>
            <Link href="/request/warehouse"><Button><Plus className="h-4 w-4" /> New request</Button></Link>
          </div>
        }
      />

      {loading ? (
        <LoadingState label="Loading your requests…" />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests yet"
          description="Request a pickup or ship a package to our warehouse to get started."
          action={
            <div className="flex gap-2">
              <Link href="/request/pickup"><Button size="sm" variant="outline"><Truck className="h-4 w-4" /> Request a Pickup</Button></Link>
              <Link href="/request/warehouse"><Button size="sm"><Warehouse className="h-4 w-4" /> Ship to Warehouse</Button></Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((req) => (
            <Card key={req.id}>
              <CardBody>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone="info">{REQUEST_TYPE_LABELS[req.type]}</Badge>
                      <span className="font-mono text-xs text-navy-400">{req.requestNumber}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-navy-900">{req.packageDescription}</p>
                    <p className="mt-1 text-xs text-navy-500">
                      {req.type === "pickup" && req.pickup
                        ? `Pickup from ${req.pickup.city ? `${req.pickup.city}, ` : ""}${req.pickup.country}`
                        : req.inbound
                          ? `To ${req.inbound.warehouse.toUpperCase()} hub${req.inbound.carrier ? ` · ${req.inbound.carrier}` : ""}`
                          : null}
                      {" · "}
                      {formatDate(req.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge meta={REQUEST_STATUS_META[req.status]} />
                    {CANCELLABLE.includes(req.status) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(req)}
                        loading={busy === req.id}
                        disabled={busy !== null}
                      >
                        Cancel
                      </Button>
                    ) : req.linkedShipmentId ? (
                      <Link href={`/shipments/${req.linkedShipmentId}`}>
                        <Button size="sm" variant="outline">View shipment <ArrowRight className="h-4 w-4" /></Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Staff view ------------------------------ */

type FilterKey = "open" | "scheduled" | "done" | "all";

function StaffRequests() {
  const { can } = useAuth();
  const { data, loading, error } = useRequests();
  const [filter, setFilter] = useState<FilterKey>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => data.find((r) => r.id === selectedId) ?? null, [data, selectedId]);

  const counts = useMemo(() => {
    const c = { open: 0, scheduled: 0, done: 0, all: data.length };
    for (const r of data) {
      if (r.status === "submitted" || r.status === "in_review") c.open += 1;
      else if (r.status === "scheduled" || r.status === "received") c.scheduled += 1;
      else c.done += 1;
    }
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    if (filter === "all") return data;
    if (filter === "open") return data.filter((r) => r.status === "submitted" || r.status === "in_review");
    if (filter === "scheduled") return data.filter((r) => r.status === "scheduled" || r.status === "received");
    return data.filter((r) => r.status === "converted" || r.status === "completed" || r.status === "cancelled");
  }, [data, filter]);

  const tabs = [
    { key: "open", label: "New", count: counts.open },
    { key: "scheduled", label: "In progress", count: counts.scheduled },
    { key: "done", label: "Closed", count: counts.done },
    { key: "all", label: "All", count: counts.all },
  ];

  return (
    <div>
      <PageHeader
        title="Customer Requests"
        description="Pickups and warehouse pre-alerts submitted by customers. Triage, schedule, then convert to a shipment."
      />
      <Tabs tabs={tabs} active={filter} onChange={(k) => setFilter(k as FilterKey)} />

      <div className="mt-4">
        {loading ? (
          <LoadingState label="Loading requests…" />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Inbox} title="Nothing here" description="No requests match this view." />
        ) : (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Request #</TH>
                  <TH>Type</TH>
                  <TH>Customer</TH>
                  <TH>Summary</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((r) => (
                  <TR key={r.id} onClick={() => setSelectedId(r.id)}>
                    <TD className="font-mono text-xs font-medium text-brand-600">{r.requestNumber}</TD>
                    <TD><Badge tone={r.type === "pickup" ? "warning" : "purple"}>{REQUEST_TYPE_LABELS[r.type]}</Badge></TD>
                    <TD className="text-sm text-navy-800">{r.customerName}</TD>
                    <TD className="max-w-xs truncate text-xs text-navy-500">{r.packageDescription}</TD>
                    <TD><StatusBadge meta={REQUEST_STATUS_META[r.status]} /></TD>
                    <TD className="text-xs text-navy-400">{formatDate(r.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>

      <RequestDetailModal
        request={selected}
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        canManage={can("requests.manage")}
      />
    </div>
  );
}

function RequestDetailModal({
  request,
  open,
  onClose,
  canManage,
}: {
  request: ShipmentRequest | null;
  open: boolean;
  onClose: () => void;
  canManage: boolean;
}) {
  const actor = useActor();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [busy, setBusy] = useState(false);

  if (!request) return null;

  async function setStatus(status: RequestStatus) {
    if (!request) return;
    setBusy(true);
    try {
      await updateRequestStatus(request.id, status, actor);
      success(`Marked ${REQUEST_STATUS_META[status].label}.`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Couldn't update the request.");
    } finally {
      setBusy(false);
    }
  }

  async function convert() {
    if (!request) return;
    setBusy(true);
    try {
      const { shipmentId, trackingNumber } = await convertRequestToShipment(request, actor);
      success(`Created shipment ${trackingNumber}.`);
      onClose();
      router.push(`/shipments/${shipmentId}`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Couldn't convert to a shipment.");
    } finally {
      setBusy(false);
    }
  }

  const isClosed = ["converted", "completed", "cancelled"].includes(request.status);

  return (
    <Modal open={open} onClose={onClose} title={`${REQUEST_TYPE_LABELS[request.type]} · ${request.requestNumber}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge meta={REQUEST_STATUS_META[request.status]} />
          <span className="text-xs text-navy-400">{formatDate(request.createdAt)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-navy-100 bg-navy-50/40 p-3">
          <KeyValue label="Customer">{request.customerName}</KeyValue>
          <KeyValue label="Phone">{request.customerPhone ?? "—"}</KeyValue>
          <KeyValue label="Pieces">{request.pieces ?? "—"}</KeyValue>
          <KeyValue label="Approx. weight">{request.approxWeightLb ? `${request.approxWeightLb} lb` : "—"}</KeyValue>
          <KeyValue label="Destination">{request.destinationCountry ?? "—"}</KeyValue>
          <KeyValue label="Declared value">{request.declaredValue ? `$${request.declaredValue}` : "—"}</KeyValue>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Contents</p>
          <p className="mt-1 text-sm text-navy-800">{request.packageDescription}</p>
        </div>

        {request.type === "pickup" && request.pickup ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Pickup</p>
            <p className="mt-1 text-sm text-navy-800">
              {request.pickup.address}
              {request.pickup.city ? `, ${request.pickup.city}` : ""}, {request.pickup.country}
            </p>
            <p className="text-xs text-navy-500">
              {request.pickup.preferredDate ? `Preferred ${formatDate(request.pickup.preferredDate)}` : "No date set"}
              {request.pickup.preferredWindow ? ` · ${request.pickup.preferredWindow}` : ""}
            </p>
          </div>
        ) : null}

        {request.type === "ship_to_warehouse" && request.inbound ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Inbound parcel</p>
            <p className="mt-1 text-sm text-navy-800">
              {request.inbound.warehouse.toUpperCase()} hub
              {request.inbound.carrier ? ` · ${request.inbound.carrier}` : ""}
            </p>
            <p className="font-mono text-xs text-navy-500">
              {request.inbound.carrierTracking ?? "No tracking provided"}
              {request.inbound.expectedArrival ? ` · ETA ${formatDate(request.inbound.expectedArrival)}` : ""}
            </p>
          </div>
        ) : null}

        {request.notes ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Notes</p>
            <p className="mt-1 text-sm text-navy-700">{request.notes}</p>
          </div>
        ) : null}

        {request.linkedShipmentId ? (
          <Link href={`/shipments/${request.linkedShipmentId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
            View linked shipment <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}

        {canManage && !isClosed ? (
          <div className="flex flex-wrap gap-2 border-t border-navy-100 pt-4">
            {request.status === "submitted" ? (
              <Button size="sm" variant="outline" onClick={() => setStatus("in_review")} loading={busy}>Start review</Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setStatus("scheduled")} disabled={busy}>Mark scheduled</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("received")} disabled={busy}>
              <PackageCheck className="h-4 w-4" /> Mark received
            </Button>
            <Button size="sm" onClick={convert} loading={busy}>
              Convert to shipment <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("cancelled")} disabled={busy}>
              <X className="h-4 w-4" /> Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
