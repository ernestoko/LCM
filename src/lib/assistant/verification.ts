import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/db/collections";
import type { Shipment, Customer, Invoice, ShipmentStatus } from "@/types";

/**
 * Server-side helpers backing the assistant identity-verification flow.
 *
 * The public tracker (`/api/track`) exposes only masked, non-personal data.
 * THIS module powers the authenticated path: after a customer proves control of
 * a contact channel on file (via OTP), the assistant may reveal the fuller,
 * shipment-scoped detail assembled by `buildSensitiveProjection`.
 */

export interface ShipmentRecord {
  id: string;
  data: Shipment;
}

/** Look up a shipment by its (case-insensitive) tracking number. */
export async function findShipmentByTracking(
  trackingNumber: string,
): Promise<ShipmentRecord | null> {
  const tn = trackingNumber.trim().toUpperCase();
  if (!tn) return null;
  const snap = await getAdminDb()
    .collection(COLLECTIONS.shipments)
    .where("trackingNumber", "==", tn)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, data: snap.docs[0].data() as Shipment };
}

/** Load the owning customer record (for contact channels + display name). */
export async function loadCustomer(customerId: string | undefined): Promise<Customer | null> {
  if (!customerId) return null;
  const doc = await getAdminDb().collection(COLLECTIONS.customers).doc(customerId).get();
  return doc.exists ? (doc.data() as Customer) : null;
}

/** Load the shipment's invoice, if one has been generated. */
export async function loadInvoiceForShipment(shipment: Shipment): Promise<Invoice | null> {
  if (shipment.invoiceId) {
    const doc = await getAdminDb().collection(COLLECTIONS.invoices).doc(shipment.invoiceId).get();
    if (doc.exists) return doc.data() as Invoice;
  }
  const snap = await getAdminDb()
    .collection(COLLECTIONS.invoices)
    .where("shipmentId", "==", shipment.id)
    .limit(1)
    .get();
  return snap.empty ? null : (snap.docs[0].data() as Invoice);
}

/* ------------------------------------------------------------------ */
/* Verifiable contact channels                                         */
/* ------------------------------------------------------------------ */

export type ChannelKind = "email" | "sms";

export interface VerifiableChannel {
  kind: ChannelKind;
  /** Real destination — server-only, never returned to the client. */
  value: string;
  /** Privacy-safe hint shown to the user, e.g. "j•••@gmail.com" / "•••• ••89". */
  hint: string;
}

/**
 * Resolve the channels a code may be sent to for this shipment. To avoid
 * leaking how many parties exist, we collapse to at most ONE email and ONE
 * phone, preferring the account holder, then the receiver, then the sender.
 */
export function buildChannels(shipment: Shipment, customer: Customer | null): VerifiableChannel[] {
  const emails = [customer?.email, shipment.receiver?.email, shipment.sender?.email]
    .map((e) => e?.trim())
    .filter((e): e is string => Boolean(e && e.includes("@")));
  const phones = [customer?.phone, shipment.receiver?.phone, shipment.sender?.phone]
    .map((p) => p?.replace(/\s+/g, "").trim())
    .filter((p): p is string => Boolean(p && p.replace(/\D/g, "").length >= 7));

  const channels: VerifiableChannel[] = [];
  if (emails[0]) channels.push({ kind: "email", value: emails[0], hint: maskEmail(emails[0]) });
  if (phones[0]) channels.push({ kind: "sms", value: phones[0], hint: maskPhone(phones[0]) });
  return channels;
}

/** "jesselyn@gmail.com" → "je•••@gmail.com". */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  const keep = local.slice(0, Math.min(2, local.length));
  return `${keep}${"•".repeat(Math.max(2, local.length - keep.length))}@${domain}`;
}

/** "+233241234589" → "•••• ••89" (keeps only the last two digits). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last2 = digits.slice(-2);
  return `•••• ••${last2}`;
}

/* ------------------------------------------------------------------ */
/* Authorised (post-verification) projection                          */
/* ------------------------------------------------------------------ */

export interface SensitiveTimelineMilestone {
  status: ShipmentStatus;
  at: string;
  location?: string;
  note?: string;
}

export interface SensitiveShipment {
  trackingNumber: string;
  status: ShipmentStatus;
  routeCode: string;
  originCountry: string;
  destinationCountry: string;
  cargoType?: string;
  customerName: string;
  receiver: {
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  contents: { description: string; category?: string; quantity?: number }[];
  packageDescription?: string;
  declaredValue?: number;
  pieces?: number;
  weightLb?: number;
  totalCbm?: number;
  paymentStatus: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  invoice?: {
    invoiceNumber: string;
    currency: string;
    total: number;
    amountPaid: number;
    balanceDue: number;
    paymentStatus: string;
  };
  timeline: SensitiveTimelineMilestone[];
}

/** Assemble the fuller, shipment-scoped detail returned after verification. */
export function buildSensitiveProjection(
  shipment: Shipment,
  invoice: Invoice | null,
): SensitiveShipment {
  return {
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    routeCode: shipment.routeCode,
    originCountry: shipment.originCountry,
    destinationCountry: shipment.destinationCountry,
    ...(shipment.cargoType ? { cargoType: shipment.cargoType } : {}),
    customerName: shipment.customerName,
    receiver: {
      name: shipment.receiver?.name ?? "Recipient",
      ...(shipment.receiver?.phone ? { phone: shipment.receiver.phone } : {}),
      ...(shipment.receiver?.address ? { address: shipment.receiver.address } : {}),
      ...(shipment.receiver?.city ? { city: shipment.receiver.city } : {}),
      ...(shipment.receiver?.country ? { country: shipment.receiver.country } : {}),
    },
    contents: (shipment.items ?? []).map((i) => ({
      description: i.description?.trim() || i.itemType || i.category,
      ...(i.category ? { category: i.category } : {}),
      ...(typeof i.quantity === "number" ? { quantity: i.quantity } : {}),
    })),
    ...(shipment.packageDescription ? { packageDescription: shipment.packageDescription } : {}),
    ...(typeof shipment.declaredValue === "number" ? { declaredValue: shipment.declaredValue } : {}),
    ...(typeof shipment.pieces === "number" ? { pieces: shipment.pieces } : {}),
    ...(typeof shipment.weightLb === "number" ? { weightLb: shipment.weightLb } : {}),
    ...(typeof shipment.totalCbm === "number" ? { totalCbm: shipment.totalCbm } : {}),
    paymentStatus: shipment.paymentStatus,
    ...(shipment.expectedDeliveryDate
      ? { expectedDeliveryDate: shipment.expectedDeliveryDate }
      : {}),
    ...(shipment.actualDeliveryDate ? { actualDeliveryDate: shipment.actualDeliveryDate } : {}),
    ...(invoice
      ? {
          invoice: {
            invoiceNumber: invoice.invoiceNumber,
            currency: invoice.currency,
            total: invoice.total,
            amountPaid: invoice.amountPaid,
            balanceDue: invoice.balanceDue,
            paymentStatus: invoice.paymentStatus,
          },
        }
      : {}),
    timeline: (shipment.statusHistory ?? []).map((e) => ({
      status: e.status,
      at: e.at,
      ...(e.location ? { location: e.location } : {}),
      ...(e.note ? { note: e.note } : {}),
    })),
  };
}
