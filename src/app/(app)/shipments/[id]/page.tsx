"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  ShieldAlert,
  RefreshCw,
  FileText,
  AlertTriangle,
  Tag,
} from "lucide-react";
import type {
  Shipment,
  ShipmentStatus,
  Customer,
  ContactParty,
  NotificationEvent,
} from "@/types";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { isCustomer } from "@/lib/auth/permissions";
import { useDocument } from "@/lib/db/hooks";
import { COLLECTIONS } from "@/lib/db/collections";
import {
  changeShipmentStatus,
  lockShipment,
  overrideDispatch,
} from "@/lib/db/repositories/shipments";
import { getCustomer } from "@/lib/db/repositories/customers";
import { generateInvoice } from "@/lib/db/repositories/invoices";
import { useRoutes } from "@/lib/db/repositories/routes";
import { usePlatformSettings } from "@/lib/db/repositories/settings";
import { checkDispatchReadiness } from "@/lib/shipments/guards";
import { notify } from "@/lib/notifications/service";
import {
  SHIPMENT_STATUS_META,
  SHIPMENT_STATUS_ORDER,
  PAYMENT_STATUS_META,
} from "@/constants/statuses";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  StatusBadge,
  Badge,
  KeyValue,
  Modal,
  Field,
  Select,
  Input,
  Textarea,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  LoadingState,
  ErrorState,
  EmptyState,
  InfoBanner,
  useToast,
} from "@/components/ui";
import { StatusTimeline } from "@/components/shipments/StatusTimeline";
import { formatMoney, formatWeight } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";

/** Map a target status to the customer lifecycle notification, where one exists. */
const STATUS_NOTIFICATION: Partial<Record<ShipmentStatus, NotificationEvent>> = {
  received_by_seal: "package_received",
  invoice_generated: "invoice_generated",
  payment_confirmed: "payment_confirmed",
  added_to_manifest: "added_to_manifest",
  dispatched: "dispatched",
  in_transit: "in_transit",
  arrived_ghana: "arrived",
  ready_for_pickup: "ready_for_pickup",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
};

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { role, can } = useAuth();
  const actor = useActor();
  const { success, error } = useToast();
  const { settings } = usePlatformSettings();
  const { data: routes } = useRoutes();

  const { data: shipment, loading, error: loadError } = useDocument<Shipment>(
    COLLECTIONS.shipments,
    id,
  );

  // Modals
  const [statusOpen, setStatusOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<ShipmentStatus>("received_by_seal");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [busy, setBusy] = useState(false);

  const isStaff = !isCustomer(role);

  const dispatchCheck = useMemo(
    () => (shipment ? checkDispatchReadiness(shipment, settings) : null),
    [shipment, settings],
  );

  if (loading) return <LoadingState label="Loading shipment…" />;
  if (loadError) return <ErrorState message={loadError.message} />;
  if (!shipment) {
    return (
      <div>
        <BackLink />
        <EmptyState title="Shipment not found" description="It may have been removed or you don't have access." />
      </div>
    );
  }

  const route = routes.find((r) => r.code === shipment.routeCode) ?? null;

  async function loadLinkedCustomer(): Promise<Customer | null> {
    if (!shipment?.customerId) return null;
    return getCustomer(shipment.customerId);
  }

  async function maybeNotifyForStatus(target: ShipmentStatus) {
    const event = STATUS_NOTIFICATION[target];
    if (!event || !shipment) return;
    const customer = await loadLinkedCustomer();
    if (!customer) return;
    await notify(
      event,
      {
        userId: customer.id,
        name: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
      {
        trackingNumber: shipment.trackingNumber,
        route: shipment.routeCode,
        status: SHIPMENT_STATUS_META[target].label,
      },
      { shipmentId: shipment.id },
    );
  }

  async function handleStatusUpdate() {
    if (!shipment) return;
    setBusy(true);
    try {
      const result = await changeShipmentStatus(shipment.id, nextStatus, actor, settings, {
        note: note || undefined,
        location: location || undefined,
      });
      if (!result.ok) {
        error(result.reason ?? "Status change is blocked.");
        return;
      }
      await maybeNotifyForStatus(nextStatus);
      success(`Status updated to ${SHIPMENT_STATUS_META[nextStatus].label}.`);
      setStatusOpen(false);
      setNote("");
      setLocation("");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOverride() {
    if (!shipment) return;
    if (!overrideReason.trim()) {
      error("A reason is required to override dispatch guards.");
      return;
    }
    setBusy(true);
    try {
      await overrideDispatch(shipment.id, overrideReason.trim(), actor);
      success("Dispatch override recorded.");
      setOverrideOpen(false);
      setOverrideReason("");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to record override.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLock() {
    if (!shipment) return;
    setBusy(true);
    try {
      await lockShipment(shipment.id, actor);
      success("Record locked.");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to lock record.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateInvoice() {
    if (!shipment) return;
    setBusy(true);
    try {
      const customer = await loadLinkedCustomer();
      const invoiceId = await generateInvoice(shipment, settings, actor, {
        customer,
        route,
      });
      await notify(
        "invoice_generated",
        {
          userId: customer?.id,
          name: customer?.fullName,
          email: customer?.email,
          phone: customer?.phone,
        },
        { trackingNumber: shipment.trackingNumber },
        { shipmentId: shipment.id },
      );
      success("Invoice generated.");
      // The shipment subscription will reflect the new invoiceId live.
      void invoiceId;
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to generate invoice.");
    } finally {
      setBusy(false);
    }
  }

  const dims = shipment.dimensions;

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={shipment.customerName}
        description={`Route ${shipment.routeCode} · ${shipment.originCountry} → ${shipment.destinationCountry}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-medium text-navy-700">
              {shipment.trackingNumber}
            </span>
            <StatusBadge meta={SHIPMENT_STATUS_META[shipment.status]} />
            {shipment.locked && (
              <Badge tone="neutral">
                <Lock className="h-3 w-3" /> Locked
              </Badge>
            )}
            <Link href={`/shipments/${shipment.id}/label`}>
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4" /> Print label
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <Card>
            <CardHeader title="Status timeline" />
            <CardBody>
              <StatusTimeline shipment={shipment} />
            </CardBody>
          </Card>

          {/* Parties */}
          <div className="grid gap-6 sm:grid-cols-2">
            <PartyCard title="Sender" party={shipment.sender} />
            <PartyCard title="Receiver" party={shipment.receiver} />
          </div>

          {/* Items / weight */}
          <Card>
            <CardHeader
              title={shipment.pricingMode === "item_based" ? "Items" : "Weight"}
              subtitle={shipment.pricingMode === "item_based" ? "Item-based pricing" : "Weight-based pricing"}
            />
            {shipment.pricingMode === "item_based" ? (
              shipment.items.length === 0 ? (
                <CardBody>
                  <p className="text-sm text-navy-400">No items recorded.</p>
                </CardBody>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Item</TH>
                      <TH>Category</TH>
                      <TH>Condition</TH>
                      <TH>Qty</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {shipment.items.map((item, i) => (
                      <TR key={i}>
                        <TD className="font-medium text-navy-800">
                          {item.itemType}
                          {item.description && (
                            <span className="block text-xs text-navy-400">{item.description}</span>
                          )}
                        </TD>
                        <TD className="text-xs capitalize">{item.category}</TD>
                        <TD className="text-xs capitalize">{item.condition}</TD>
                        <TD>{item.quantity}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )
            ) : (
              <CardBody>
                <KeyValue label="Billable weight">{formatWeight(shipment.weightLb)}</KeyValue>
              </CardBody>
            )}
          </Card>

          {/* Measurements */}
          <Card>
            <CardHeader title="Measurements" />
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KeyValue label="Weight">{formatWeight(shipment.weightLb)}</KeyValue>
              <KeyValue label="Dimensions">
                {dims && (dims.lengthIn || dims.widthIn || dims.heightIn)
                  ? `${dims.lengthIn ?? "—"} × ${dims.widthIn ?? "—"} × ${dims.heightIn ?? "—"} in`
                  : "—"}
              </KeyValue>
              <KeyValue label="Volumetric">{formatWeight(shipment.volumetricWeightLb)}</KeyValue>
              <KeyValue label="Declared value">
                {shipment.declaredValue != null
                  ? formatMoney(shipment.declaredValue, settings.defaultCurrency)
                  : "—"}
              </KeyValue>
            </CardBody>
          </Card>

          {/* Package description */}
          {shipment.packageDescription && (
            <Card>
              <CardHeader title="Package description" />
              <CardBody>
                <p className="text-sm text-navy-700">{shipment.packageDescription}</p>
              </CardBody>
            </Card>
          )}

          {/* Photos */}
          <Card>
            <CardHeader title="Photos" subtitle={`${shipment.photoUrls?.length ?? 0} image(s)`} />
            <CardBody>
              {shipment.photoUrls && shipment.photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {shipment.photoUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block overflow-hidden rounded-lg border border-navy-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Package photo ${i + 1}`}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-navy-400">No photos uploaded yet.</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Summary */}
          <Card>
            <CardHeader title="Summary" />
            <CardBody className="space-y-4">
              <KeyValue label="Payment">
                <StatusBadge meta={PAYMENT_STATUS_META[shipment.paymentStatus]} />
              </KeyValue>
              <KeyValue label="SEAL office">{shipment.assignedSealOffice}</KeyValue>
              <KeyValue label="Expected delivery">{formatDate(shipment.expectedDeliveryDate)}</KeyValue>
              <KeyValue label="Actual delivery">{formatDate(shipment.actualDeliveryDate)}</KeyValue>
            </CardBody>
          </Card>

          {/* Linked records */}
          <Card>
            <CardHeader title="Linked records" />
            <CardBody className="space-y-3">
              {/* Invoice */}
              {shipment.invoiceId ? (
                <Link
                  href={`/invoices/${shipment.invoiceId}`}
                  className="flex items-center justify-between rounded-lg border border-navy-100 px-3 py-2.5 text-sm hover:bg-navy-50"
                >
                  <span className="inline-flex items-center gap-2 font-medium text-navy-800">
                    <FileText className="h-4 w-4 text-brand-600" /> View invoice
                  </span>
                  <span className="text-xs text-brand-600">Open →</span>
                </Link>
              ) : can("invoices.generate") ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateInvoice}
                  loading={busy}
                >
                  <FileText className="h-4 w-4" /> Generate invoice
                </Button>
              ) : (
                <p className="text-sm text-navy-400">No invoice generated yet.</p>
              )}

              {/* Manifest */}
              {shipment.manifestId ? (
                <Link
                  href={`/manifests/${shipment.manifestId}`}
                  className="flex items-center justify-between rounded-lg border border-navy-100 px-3 py-2.5 text-sm hover:bg-navy-50"
                >
                  <span className="font-medium text-navy-800">View manifest</span>
                  <span className="text-xs text-brand-600">Open →</span>
                </Link>
              ) : (
                <p className="text-sm text-navy-400">Not added to a manifest.</p>
              )}
            </CardBody>
          </Card>

          {/* Actions (staff only) */}
          {isStaff && (
            <Card>
              <CardHeader title="Actions" />
              <CardBody className="space-y-3">
                {dispatchCheck && !dispatchCheck.ok && (
                  <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <p className="text-xs font-semibold text-amber-800">Dispatch blockers</p>
                    {dispatchCheck.blockers.map((b, i) => (
                      <p key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {b}
                      </p>
                    ))}
                  </div>
                )}

                {shipment.locked && (
                  <InfoBanner tone="warning">
                    This record is locked and cannot be modified.
                  </InfoBanner>
                )}

                {can("shipments.status.update") && (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setStatusOpen(true)}
                    disabled={shipment.locked}
                  >
                    <RefreshCw className="h-4 w-4" /> Update status
                  </Button>
                )}

                {can("shipments.override_dispatch") && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setOverrideOpen(true)}
                    disabled={shipment.locked}
                  >
                    <ShieldAlert className="h-4 w-4" /> Admin override
                  </Button>
                )}

                {can("shipments.lock") && !shipment.locked && (
                  <Button variant="ghost" className="w-full" onClick={handleLock} loading={busy}>
                    <Lock className="h-4 w-4" /> Lock record
                  </Button>
                )}

                {shipment.dispatchOverride && (
                  <p className="text-xs text-navy-500">
                    Override by {shipment.dispatchOverride.byName ?? "admin"}:{" "}
                    {shipment.dispatchOverride.reason}
                  </p>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Update status modal */}
      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Update status"
        description="Move this shipment to the next stage."
        footer={
          <>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} loading={busy}>
              Update
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="New status" required>
            <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as ShipmentStatus)}>
              {SHIPMENT_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {SHIPMENT_STATUS_META[s].label}
                </option>
              ))}
              <option value="issue_reported">{SHIPMENT_STATUS_META.issue_reported.label}</option>
              <option value="cancelled">{SHIPMENT_STATUS_META.cancelled.label}</option>
            </Select>
          </Field>
          <Field label="Location" hint="Optional — where the package is now.">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Accra hub" />
          </Field>
          <Field label="Note">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the timeline" />
          </Field>
          {dispatchCheck && !dispatchCheck.ok && (
            <InfoBanner tone="warning">
              Dispatch guards are not yet satisfied — moving to dispatch will be blocked until resolved or overridden.
            </InfoBanner>
          )}
        </div>
      </Modal>

      {/* Admin override modal */}
      <Modal
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        title="Admin override"
        description="Bypass the payment-confirmation dispatch guard. This is audited."
        footer={
          <>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleOverride} loading={busy}>
              Record override
            </Button>
          </>
        }
      >
        <Field label="Reason" required>
          <Textarea
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Explain why this override is necessary"
          />
        </Field>
      </Modal>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/shipments"
      className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-800"
    >
      <ArrowLeft className="h-4 w-4" /> Back to shipments
    </Link>
  );
}

function PartyCard({ title, party }: { title: string; party: ContactParty }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="space-y-3">
        <KeyValue label="Name">{party.name}</KeyValue>
        <KeyValue label="Phone">{party.phone}</KeyValue>
        <KeyValue label="Email">{party.email}</KeyValue>
        <KeyValue label="Address">
          {[party.address, party.city, party.country].filter(Boolean).join(", ") || "—"}
        </KeyValue>
      </CardBody>
    </Card>
  );
}
