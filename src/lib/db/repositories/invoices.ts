"use client";

import { orderBy, where } from "firebase/firestore";
import { create, update, getOne, getMany, nextSequence } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import { formatInvoiceNumber } from "@/lib/utils/ids";
import { calculatePricing, selectActiveRateCard } from "@/lib/pricing/engine";
import type {
  Invoice,
  Shipment,
  ShipmentStatus,
  ShipmentStatusEvent,
  RateCard,
  CountryRoute,
  PlatformSettings,
  Customer,
} from "@/types";

/**
 * Generate an invoice for a shipment using SEAL's currently-active approved
 * rate card. Recalculates from scratch so invoices are always reproducible.
 */
export async function generateInvoice(
  shipment: Shipment,
  settings: PlatformSettings,
  actor: AuditActor,
  opts: {
    rateCards?: RateCard[];
    route?: CountryRoute | null;
    customer?: Customer | null;
    paymentInstructions?: string;
  } = {},
): Promise<string> {
  const rateCards = opts.rateCards ?? (await getMany<RateCard>(COLLECTIONS.rateCards));
  const route =
    opts.route ??
    (await getMany<CountryRoute>(COLLECTIONS.countryRoutes)).find(
      (r) => r.code === shipment.routeCode,
    ) ??
    null;

  const itemRateCard = selectActiveRateCard(rateCards, "item_based", shipment.routeCode, shipment.destinationCountry);
  const weightRateCard = selectActiveRateCard(rateCards, "weight_based", shipment.routeCode, shipment.destinationCountry);

  const pricing = calculatePricing(
    {
      pricingMode: shipment.pricingMode,
      items: shipment.items,
      weightLb: shipment.weightLb,
      routeCode: shipment.routeCode,
      destinationCountry: shipment.destinationCountry,
      customerId: shipment.customerId,
      customerSource: opts.customer?.source,
    },
    { itemRateCard, weightRateCard, route, settings },
  );

  const seq = await nextSequence("invoice");
  const invoiceNumber = formatInvoiceNumber(seq);

  // Compose payment instructions + a snapshot of enabled payout accounts so the
  // invoice (and its emailed copy) always show how to pay, reproducibly.
  const baseInstructions = opts.paymentInstructions ?? settings.paymentInstructions;
  const accountLines = (settings.payoutAccounts ?? [])
    .filter((a) => a.enabled)
    .map((a) => {
      const parts = [a.label];
      if (a.accountName) parts.push(`Name: ${a.accountName}`);
      if (a.accountNumber) parts.push(`Acct: ${a.accountNumber}`);
      if (a.bankOrProvider) parts.push(a.bankOrProvider);
      if (a.instructions) parts.push(a.instructions);
      return `• ${parts.join(" — ")}`;
    });
  const paymentInstructions = accountLines.length
    ? `${baseInstructions}\n\nPay to:\n${accountLines.join("\n")}`
    : baseInstructions;

  const invoice: Partial<Invoice> = {
    invoiceNumber,
    shipmentId: shipment.id,
    trackingNumber: shipment.trackingNumber,
    customerId: shipment.customerId,
    customerName: shipment.customerName,
    routeCode: shipment.routeCode,
    currency: pricing.currency,
    lines: pricing.lines,
    subtotal: pricing.subtotal,
    serviceFee: pricing.serviceFee,
    additionalCharges: pricing.additionalCharges,
    total: pricing.total,
    amountPaid: 0,
    balanceDue: pricing.total,
    paymentStatus: "unpaid",
    rateCardId: pricing.rateCardId,
    rateCardName: pricing.rateCardName,
    rateCardEffectiveDate: pricing.rateCardEffectiveDate,
    paymentInstructions,
    generatedBy: actor.uid,
    generatedByName: actor.name,
    commission: pricing.commission,
  };

  const id = await create<Partial<Invoice>>(COLLECTIONS.invoices, invoice, actor);

  // Link back to the shipment and advance its lifecycle. Do NOT reset
  // paymentStatus — regenerating an invoice must never wipe a recorded payment.
  await update<Shipment>(COLLECTIONS.shipments, shipment.id, {
    invoiceId: id,
    libertyHandlingStatus: "invoiced",
    status: shipment.status === "inspected" || shipment.status === "received_by_seal" ? "invoice_generated" : shipment.status,
  });

  await logAudit(actor, {
    action: "invoice_generate",
    entity: COLLECTIONS.invoices,
    entityId: id,
    newValue: invoiceNumber,
  });
  return id;
}

/** Statuses from which a fully-paid invoice should advance the shipment. */
const PRE_PAYMENT_STATUSES: ShipmentStatus[] = [
  "draft",
  "awaiting_package",
  "received_by_seal",
  "inspected",
  "invoice_generated",
  "payment_pending",
];

/** Apply a payment amount to an invoice, updating balance + status. */
export async function applyPaymentToInvoice(
  invoiceId: string,
  amount: number,
  actor: AuditActor,
): Promise<void> {
  const inv = await getOne<Invoice>(COLLECTIONS.invoices, invoiceId);
  if (!inv) return;
  const amountPaid = Math.min(inv.total, (inv.amountPaid ?? 0) + amount);
  const balanceDue = Math.max(0, inv.total - amountPaid);
  const fullyPaid = balanceDue <= 0;
  const invoiceStatus: Invoice["paymentStatus"] =
    fullyPaid ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
  await update<Invoice>(
    COLLECTIONS.invoices,
    invoiceId,
    { amountPaid, balanceDue, paymentStatus: invoiceStatus },
    actor,
  );

  // Mirror onto the shipment. A fully-settled invoice CONFIRMS payment and
  // advances the lifecycle to `payment_confirmed` (with a history event) when
  // the shipment is still in a pre-payment stage.
  const shipment = await getOne<Shipment>(COLLECTIONS.shipments, inv.shipmentId);
  if (!shipment) return;
  const patch: Partial<Shipment> = {
    paymentStatus: fullyPaid ? "confirmed" : invoiceStatus,
  };
  if (fullyPaid && PRE_PAYMENT_STATUSES.includes(shipment.status)) {
    const event: ShipmentStatusEvent = {
      status: "payment_confirmed",
      at: new Date().toISOString(),
      by: actor.uid,
      byName: actor.name,
      note: "Payment received in full",
    };
    patch.status = "payment_confirmed";
    patch.statusHistory = [...(shipment.statusHistory ?? []), event];
  }
  await update<Shipment>(COLLECTIONS.shipments, inv.shipmentId, patch, actor);
}

export function getInvoice(id: string) {
  return getOne<Invoice>(COLLECTIONS.invoices, id);
}

export function useInvoices() {
  return useCollection<Invoice>(COLLECTIONS.invoices, [orderBy("createdAt", "desc")]);
}

export function useCustomerInvoices(customerId: string | null | undefined) {
  return useCollection<Invoice>(
    COLLECTIONS.invoices,
    customerId ? [where("customerId", "==", customerId), orderBy("createdAt", "desc")] : [],
    { enabled: Boolean(customerId), deps: ["customer-invoices", customerId] },
  );
}
