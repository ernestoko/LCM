"use client";

import { orderBy, where } from "firebase/firestore";
import { create, update, getOne, type WithId } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import { generateTrackingNumber, routeCode as makeRouteCode } from "@/lib/utils/ids";
import { bumpCustomerStats } from "./customers";
import type {
  Shipment,
  ShipmentStatus,
  ShipmentStatusEvent,
  PlatformSettings,
} from "@/types";
import { SHIPMENT_STATUS_META } from "@/constants/statuses";
import { canMoveToStatus } from "@/lib/shipments/guards";

export type NewShipment = Omit<
  Shipment,
  | "id"
  | "trackingNumber"
  | "status"
  | "sealHandlingStatus"
  | "libertyHandlingStatus"
  | "statusHistory"
  | "photoUrls"
  | "documentUrls"
  | "locked"
  | "paymentStatus"
  | "createdAt"
  | "createdBy"
  | "routeCode"
> & {
  status?: ShipmentStatus;
  routeCode?: string;
};

export async function createShipment(
  data: NewShipment,
  actor: AuditActor,
): Promise<{ id: string; trackingNumber: string }> {
  const trackingNumber = generateTrackingNumber();
  const routeCode =
    data.routeCode || makeRouteCode(data.originCountry, data.destinationCountry);
  const status: ShipmentStatus = data.status ?? "draft";
  const event: ShipmentStatusEvent = {
    status,
    at: new Date().toISOString(),
    by: actor.uid,
    byName: actor.name,
    note: "Shipment created",
  };

  const id = await create<Partial<Shipment>>(
    COLLECTIONS.shipments,
    {
      ...data,
      trackingNumber,
      routeCode,
      status,
      paymentStatus: "unpaid",
      sealHandlingStatus: "not_started",
      libertyHandlingStatus: "created",
      photoUrls: [],
      documentUrls: [],
      statusHistory: [event],
      locked: false,
    },
    actor,
  );

  await logAudit(actor, {
    action: "shipment_create",
    entity: COLLECTIONS.shipments,
    entityId: id,
    newValue: trackingNumber,
  });
  if (data.customerId) await bumpCustomerStats(data.customerId, 1, 0);

  return { id, trackingNumber };
}

export async function updateShipment(
  id: string,
  data: Partial<Shipment>,
  actor: AuditActor,
): Promise<void> {
  await update<Shipment>(COLLECTIONS.shipments, id, data, actor);
  await logAudit(actor, {
    action: "shipment_edit",
    entity: COLLECTIONS.shipments,
    entityId: id,
  });
}

/**
 * Transition a shipment to a new status, enforcing dispatch guards and
 * appending to the immutable status history.
 */
export async function changeShipmentStatus(
  id: string,
  next: ShipmentStatus,
  actor: AuditActor,
  settings: PlatformSettings,
  opts: { note?: string; location?: string } = {},
): Promise<{ ok: boolean; reason?: string }> {
  const shipment = await getOne<Shipment>(COLLECTIONS.shipments, id);
  if (!shipment) return { ok: false, reason: "Shipment not found." };

  const check = canMoveToStatus(shipment, next, settings);
  if (!check.ok) return check;

  const event: ShipmentStatusEvent = {
    status: next,
    at: new Date().toISOString(),
    by: actor.uid,
    byName: actor.name,
    note: opts.note,
    location: opts.location,
  };
  const history = [...(shipment.statusHistory ?? []), event];

  // Keep payment status in sync with key milestones.
  const patch: Partial<Shipment> = { status: next, statusHistory: history };
  if (next === "payment_confirmed") patch.paymentStatus = "confirmed";
  if (next === "delivered") patch.actualDeliveryDate = new Date().toISOString();

  await update<Shipment>(COLLECTIONS.shipments, id, patch, actor);
  await logAudit(actor, {
    action: "shipment_status_change",
    entity: COLLECTIONS.shipments,
    entityId: id,
    oldValue: SHIPMENT_STATUS_META[shipment.status].label,
    newValue: SHIPMENT_STATUS_META[next].label,
    reason: opts.note,
  });
  return { ok: true };
}

/** Super Admin locks a completed shipment record (read-only thereafter). */
export async function lockShipment(id: string, actor: AuditActor): Promise<void> {
  await update<Shipment>(COLLECTIONS.shipments, id, { locked: true }, actor);
  await logAudit(actor, {
    action: "shipment_edit",
    entity: COLLECTIONS.shipments,
    entityId: id,
    field: "locked",
    newValue: "true",
  });
}

/** Record an admin override of a dispatch guard, with required reason. */
export async function overrideDispatch(
  id: string,
  reason: string,
  actor: AuditActor,
): Promise<void> {
  await update<Shipment>(
    COLLECTIONS.shipments,
    id,
    { dispatchOverride: { by: actor.uid, byName: actor.name, at: new Date().toISOString(), reason } },
    actor,
  );
  await logAudit(actor, {
    action: "admin_override",
    entity: COLLECTIONS.shipments,
    entityId: id,
    reason,
  });
}

export function getShipment(id: string) {
  return getOne<Shipment>(COLLECTIONS.shipments, id);
}

// --- Live hooks ------------------------------------------------------------

export function useShipments(): { data: WithId<Shipment>[]; loading: boolean; error: Error | null } {
  return useCollection<Shipment>(COLLECTIONS.shipments, [orderBy("createdAt", "desc")]);
}

export function useCustomerShipments(customerId: string | null | undefined) {
  return useCollection<Shipment>(
    COLLECTIONS.shipments,
    customerId ? [where("customerId", "==", customerId), orderBy("createdAt", "desc")] : [],
    { enabled: Boolean(customerId) },
  );
}

export function useSealShipments(office?: string) {
  // SEAL sees shipments assigned to its office (or all if none specified).
  return useCollection<Shipment>(
    COLLECTIONS.shipments,
    office
      ? [where("assignedSealOffice", "==", office), orderBy("sealHandlingStatus")]
      : [orderBy("createdAt", "desc")],
  );
}
