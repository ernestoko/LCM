import { NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/db/collections";
import { shipmentStatusOrder } from "@/constants/statuses";
import type { Shipment, ShipmentStatus, ShipmentStatusEvent, CargoType } from "@/types";

/**
 * Public package-tracking endpoint.
 *
 * Privacy-first: this is reachable WITHOUT authentication, so it must expose
 * only the minimal information needed to follow a shipment. It deliberately
 * strips all personal data (phone/email/address), all staff names, and all
 * internal notes. The recipient name is masked (e.g. "Kwame A.").
 */

/** A single privacy-safe milestone in the public timeline. */
export interface PublicTimelineMilestone {
  status: ShipmentStatus;
  at: string;
  location?: string;
}

/** The minimal, privacy-safe shipment projection returned to the public. */
export interface PublicShipment {
  trackingNumber: string;
  status: ShipmentStatus;
  cargoType?: CargoType;
  routeCode: string;
  originCountry: string;
  destinationCountry: string;
  recipientName: string; // masked, e.g. "Kwame A."
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  progressPercent: number;
  timeline: PublicTimelineMilestone[];
}

export interface TrackSuccess {
  ok: true;
  shipment: PublicShipment;
}

export interface TrackError {
  ok: false;
  error: string;
}

export type TrackResponse = TrackSuccess | TrackError;

/**
 * Mask a recipient's name to "FirstName X." — keep the first name in full,
 * then the first initial of any further word. Returns "Recipient" if empty.
 */
function maskName(raw: string | undefined | null): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "Recipient";
  const parts = trimmed.split(/\s+/);
  const [first, ...rest] = parts;
  if (rest.length === 0) return first;
  const initials = rest
    .map((word) => word.charAt(0).toUpperCase())
    .filter(Boolean)
    .map((initial) => `${initial}.`)
    .join(" ");
  return initials ? `${first} ${initials}` : first;
}

/**
 * Compute progress (0–100) from the status' position in the canonical
 * lifecycle order. Terminal/off-pipeline statuses (issue_reported, cancelled)
 * are not in the order array, so they resolve to 0.
 */
function computeProgressPercent(status: ShipmentStatus, cargoType?: CargoType): number {
  const order = shipmentStatusOrder(cargoType);
  const index = order.indexOf(status);
  if (index < 0) return 0;
  const last = order.length - 1;
  if (last <= 0) return 0;
  return Math.round((index / last) * 100);
}

/** Strip every status event down to the three public-safe fields. */
function toPublicTimeline(
  history: ShipmentStatusEvent[] | undefined,
): PublicTimelineMilestone[] {
  if (!Array.isArray(history)) return [];
  return history.map((event) => ({
    status: event.status,
    at: event.at,
    ...(event.location ? { location: event.location } : {}),
  }));
}

export async function GET(_request: Request, props: { params: Promise<{ trackingNumber: string }> }): Promise<NextResponse<TrackResponse>> {
  const params = await props.params;
  if (!isAdminConfigured) {
    return NextResponse.json(
      { ok: false, error: "Tracking is not configured." },
      { status: 503 },
    );
  }

  // Tracking numbers are stored uppercase — normalise so lookup is
  // case-insensitive and tolerant of stray whitespace from copy/paste.
  const trackingNumber = params.trackingNumber?.trim().toUpperCase();
  if (!trackingNumber) {
    return NextResponse.json(
      { ok: false, error: "No shipment found for that tracking number." },
      { status: 404 },
    );
  }

  try {
    const snapshot = await getAdminDb()
      .collection(COLLECTIONS.shipments)
      .where("trackingNumber", "==", trackingNumber)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { ok: false, error: "No shipment found for that tracking number." },
        { status: 404 },
      );
    }

    const data = snapshot.docs[0].data() as Shipment;

    const shipment: PublicShipment = {
      trackingNumber: data.trackingNumber,
      status: data.status,
      ...(data.cargoType ? { cargoType: data.cargoType } : {}),
      routeCode: data.routeCode,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
      recipientName: maskName(data.receiver?.name),
      ...(data.expectedDeliveryDate
        ? { expectedDeliveryDate: data.expectedDeliveryDate }
        : {}),
      ...(data.actualDeliveryDate
        ? { actualDeliveryDate: data.actualDeliveryDate }
        : {}),
      progressPercent: computeProgressPercent(data.status, data.cargoType),
      timeline: toPublicTimeline(data.statusHistory),
    };

    return NextResponse.json({ ok: true, shipment });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Tracking is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
