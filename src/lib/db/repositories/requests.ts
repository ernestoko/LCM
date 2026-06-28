"use client";

import { orderBy, where } from "firebase/firestore";
import { create, update, getOne, nextSequence } from "../firestore";
import { useCollection, useDocument } from "../hooks";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import { formatRequestNumber } from "@/lib/utils/ids";
import { createShipment } from "./shipments";
import { getWarehouse } from "@/constants/warehouses";
import type {
  ShipmentRequest,
  RequestStatus,
  RequestStatusEvent,
} from "@/types";

export type NewRequest = Omit<
  ShipmentRequest,
  | "id"
  | "requestNumber"
  | "status"
  | "statusHistory"
  | "photoUrls"
  | "linkedShipmentId"
  | "createdAt"
  | "createdBy"
> & { photoUrls?: string[] };

function event(
  status: RequestStatus,
  actor: AuditActor,
  note?: string,
): RequestStatusEvent {
  return {
    status,
    at: new Date().toISOString(),
    by: actor.uid,
    byName: actor.name,
    ...(note ? { note } : {}),
  };
}

/** Customer creates a pickup / ship-to-warehouse request. */
export async function createRequest(
  data: NewRequest,
  actor: AuditActor,
): Promise<{ id: string; requestNumber: string }> {
  const seq = await nextSequence("request");
  const requestNumber = formatRequestNumber(seq);
  const id = await create<Partial<ShipmentRequest>>(
    COLLECTIONS.requests,
    {
      ...data,
      requestNumber,
      status: "submitted",
      photoUrls: data.photoUrls ?? [],
      statusHistory: [event("submitted", actor, "Request submitted")],
    },
    actor,
  );
  await logAudit(actor, {
    action: "settings_change",
    entity: COLLECTIONS.requests,
    entityId: id,
    newValue: data.type,
  });
  return { id, requestNumber };
}

/** Staff move a request along its lifecycle (review → scheduled → received …). */
export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  actor: AuditActor,
  note?: string,
): Promise<void> {
  const current = await getOne<ShipmentRequest>(COLLECTIONS.requests, id);
  const history = [...(current?.statusHistory ?? []), event(status, actor, note)];
  await update<ShipmentRequest>(
    COLLECTIONS.requests,
    id,
    { status, statusHistory: history, handledBy: actor.uid, handledByName: actor.name },
    actor,
  );
  await logAudit(actor, {
    action: "settings_change",
    entity: COLLECTIONS.requests,
    entityId: id,
    field: "status",
    newValue: status,
  });
}

/** Customer (or staff) cancels a request that hasn't been converted yet. */
export async function cancelRequest(
  id: string,
  actor: AuditActor,
  note?: string,
): Promise<void> {
  await updateRequestStatus(id, "cancelled", actor, note ?? "Cancelled by customer");
}

/**
 * Staff convert a request into a draft Shipment they then complete. Builds a
 * best-effort shipment from the request and links the two records.
 */
export async function convertRequestToShipment(
  req: ShipmentRequest,
  actor: AuditActor,
): Promise<{ shipmentId: string; trackingNumber: string }> {
  const hub = req.inbound ? getWarehouse(req.inbound.warehouse) : undefined;
  const originCountry =
    req.pickup?.country ?? hub?.country ?? "United States";
  const destinationCountry = req.destinationCountry ?? req.receiver?.country ?? "Ghana";

  const { id: shipmentId, trackingNumber } = await createShipment(
    {
      customerId: req.customerId,
      customerName: req.customerName,
      sender: {
        name: req.customerName,
        phone: req.customerPhone,
        address: req.pickup?.address,
        city: req.pickup?.city,
        country: originCountry,
      },
      receiver: req.receiver ?? { name: req.customerName, country: destinationCountry },
      originCountry,
      destinationCountry,
      cargoType: req.cargoType,
      pricingMode: "item_based",
      items: [],
      pieces: req.pieces,
      packageDescription: req.packageDescription,
      declaredValue: req.declaredValue,
      status: "draft",
    },
    actor,
  );

  const current = await getOne<ShipmentRequest>(COLLECTIONS.requests, req.id);
  const history = [
    ...(current?.statusHistory ?? []),
    event("converted", actor, `Converted to shipment ${trackingNumber}`),
  ];
  await update<ShipmentRequest>(
    COLLECTIONS.requests,
    req.id,
    {
      status: "converted",
      linkedShipmentId: shipmentId,
      statusHistory: history,
      handledBy: actor.uid,
      handledByName: actor.name,
    },
    actor,
  );

  return { shipmentId, trackingNumber };
}

// ---- hooks ----------------------------------------------------------------

export function useRequests() {
  return useCollection<ShipmentRequest>(COLLECTIONS.requests, [
    orderBy("createdAt", "desc"),
  ]);
}

export function useCustomerRequests(customerId: string | null | undefined) {
  return useCollection<ShipmentRequest>(
    COLLECTIONS.requests,
    customerId
      ? [where("customerId", "==", customerId), orderBy("createdAt", "desc")]
      : [],
    { enabled: Boolean(customerId), deps: ["customer-requests", customerId] },
  );
}

export function useRequest(id: string | null | undefined) {
  return useDocument<ShipmentRequest>(COLLECTIONS.requests, id ?? "");
}
