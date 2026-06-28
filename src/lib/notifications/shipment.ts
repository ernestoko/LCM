"use client";

import { notify } from "./service";
import { BUSINESS } from "@/constants/business";
import type { Shipment } from "@/types";

/** Public tracking URL for a shipment — shared by the package label and notifications. */
export function trackUrlFor(trackingNumber: string): string {
  return `https://${BUSINESS.website}/track/${trackingNumber}`;
}

/**
 * On dispatch, alert the RECIPIENT (consignee) that a package is on its way and
 * give them a link to track it themselves. The recipient is usually not a
 * registered user, so this goes out over email/SMS only (no in-app bell).
 */
export async function notifyRecipientIncoming(
  shipment: Pick<
    Shipment,
    "id" | "trackingNumber" | "routeCode" | "customerName" | "receiver"
  >,
): Promise<void> {
  const r = shipment.receiver;
  if (!r?.name || (!r.email && !r.phone)) return;
  await notify(
    "recipient_incoming",
    { name: r.name, email: r.email, phone: r.phone },
    {
      trackingNumber: shipment.trackingNumber,
      senderName: shipment.customerName,
      route: shipment.routeCode,
      trackUrl: trackUrlFor(shipment.trackingNumber),
    },
    { shipmentId: shipment.id, channels: ["email", "sms"] },
  ).catch(() => {});
}
