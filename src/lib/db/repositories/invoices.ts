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
    paymentInstructions: opts.paymentInstructions ?? settings.paymentInstructions,
    generatedBy: actor.uid,
    generatedByName: actor.name,
    commission: pricing.commission,
  };

  const id = await create<Partial<Invoice>>(COLLECTIONS.invoices, invoice, actor);

  // Link back to the shipment and advance its lifecycle.
  await update<Shipment>(COLLECTIONS.shipments, shipment.id, {
    invoiceId: id,
    paymentStatus: "unpaid",
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
  const paymentStatus: Invoice["paymentStatus"] =
    balanceDue <= 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
  await update<Invoice>(COLLECTIONS.invoices, invoiceId, { amountPaid, balanceDue, paymentStatus }, actor);
  // Mirror onto the shipment.
  await update<Shipment>(COLLECTIONS.shipments, inv.shipmentId, { paymentStatus });
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
    { enabled: Boolean(customerId) },
  );
}
