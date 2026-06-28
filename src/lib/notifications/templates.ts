import type { NotificationEvent } from "@/types";

export interface TemplateContext {
  customerName?: string;
  trackingNumber?: string;
  invoiceNumber?: string;
  amount?: string;
  route?: string;
  manifestNumber?: string;
  status?: string;
  eta?: string;
  ticketNumber?: string;
  supportPhone?: string;
  supportEmail?: string;
  trackUrl?: string;
  senderName?: string;
  [key: string]: string | undefined;
}

export interface RenderedTemplate {
  subject: string;
  /** Plain body, used for SMS (kept short) and in-app. */
  sms: string;
  /** Richer body for email/WhatsApp. */
  email: string;
  whatsapp: string;
}

const COMPANY = "Liberty & Liberty Logistics";

/**
 * Notification copy for every lifecycle event. SMS bodies are intentionally
 * short (single segment where possible) for mNotify; email/WhatsApp are richer.
 */
export const TEMPLATES: Record<NotificationEvent, (c: TemplateContext) => RenderedTemplate> = {
  package_received: (c) => ({
    subject: `Package received — ${c.trackingNumber}`,
    sms: `${COMPANY}: Hi ${c.customerName ?? "there"}, your package ${c.trackingNumber} has been received by Operations. We'll keep you updated.`,
    email: `Hi ${c.customerName ?? "there"},\n\nGood news — your package (${c.trackingNumber}) has been received at our intake point and is being processed.\n\nWe'll notify you at each step.\n\n— ${COMPANY}`,
    whatsapp: `📦 *${COMPANY}*\nHi ${c.customerName ?? "there"}, your package *${c.trackingNumber}* has been received by Operations and is being processed.`,
  }),
  invoice_generated: (c) => ({
    subject: `Invoice ${c.invoiceNumber} — ${c.amount}`,
    sms: `${COMPANY}: Invoice ${c.invoiceNumber} for ${c.trackingNumber} is ready. Amount: ${c.amount}. Pay using your tracking number as reference.`,
    email: `Hi ${c.customerName ?? "there"},\n\nYour invoice ${c.invoiceNumber} for shipment ${c.trackingNumber} is ready.\n\nTotal due: ${c.amount}\nPrices are based on our approved rate card for the period.\n\nPlease use your tracking number as the payment reference.\n\n— ${COMPANY}`,
    whatsapp: `🧾 *${COMPANY}*\nInvoice *${c.invoiceNumber}* is ready.\nShipment: ${c.trackingNumber}\nAmount due: *${c.amount}*\nUse your tracking number as the payment reference.`,
  }),
  payment_confirmed: (c) => ({
    subject: `Payment confirmed — ${c.trackingNumber}`,
    sms: `${COMPANY}: We've confirmed your payment for ${c.trackingNumber}. Thank you! Your package will be added to the next manifest.`,
    email: `Hi ${c.customerName ?? "there"},\n\nWe've received and confirmed your payment for shipment ${c.trackingNumber}. Thank you!\n\nYour package will now be added to the next dispatch manifest.\n\n— ${COMPANY}`,
    whatsapp: `✅ *${COMPANY}*\nPayment confirmed for *${c.trackingNumber}*. Thank you! Your package is queued for the next manifest.`,
  }),
  added_to_manifest: (c) => ({
    subject: `Added to manifest — ${c.trackingNumber}`,
    sms: `${COMPANY}: Your package ${c.trackingNumber} has been added to manifest ${c.manifestNumber} and is ready for dispatch.`,
    email: `Hi ${c.customerName ?? "there"},\n\nYour package ${c.trackingNumber} has been added to manifest ${c.manifestNumber} and is ready for dispatch.\n\n— ${COMPANY}`,
    whatsapp: `📋 *${COMPANY}*\n*${c.trackingNumber}* added to manifest *${c.manifestNumber}* — ready for dispatch.`,
  }),
  dispatched: (c) => ({
    subject: `Dispatched — ${c.trackingNumber}`,
    sms: `${COMPANY}: Your package ${c.trackingNumber} has been dispatched${c.eta ? `. ETA: ${c.eta}` : ""}.${c.trackUrl ? ` Track: ${c.trackUrl}` : ""}`,
    email: `Hi ${c.customerName ?? "there"},\n\nYour package ${c.trackingNumber} has been dispatched on route ${c.route ?? ""}.${c.eta ? `\nEstimated arrival: ${c.eta}.` : ""}${c.trackUrl ? `\n\nTrack your package here: ${c.trackUrl}` : ""}\n\n— ${COMPANY}`,
    whatsapp: `🚚 *${COMPANY}*\n*${c.trackingNumber}* dispatched${c.eta ? `\nETA: ${c.eta}` : ""}.${c.trackUrl ? `\nTrack: ${c.trackUrl}` : ""}`,
  }),
  recipient_incoming: (c) => ({
    subject: `A package is on its way to you — ${c.trackingNumber}`,
    sms: `${COMPANY}: Hi ${c.customerName ?? "there"}, a package from ${c.senderName ?? "a sender"} (${c.trackingNumber}) has shipped and is on its way to you. Please standby.${c.trackUrl ? ` Track: ${c.trackUrl}` : ""}`,
    email: `Hi ${c.customerName ?? "there"},\n\nGood news — a package from ${c.senderName ?? "a sender"} has been shipped to you via ${COMPANY} (tracking ${c.trackingNumber}${c.route ? `, route ${c.route}` : ""}).\n\nPlease standby to receive it — we'll keep you posted as it moves.${c.trackUrl ? `\n\nTrack your package here: ${c.trackUrl}` : ""}\n\n— ${COMPANY}`,
    whatsapp: `📦 *${COMPANY}*\nHi ${c.customerName ?? "there"}, a package from ${c.senderName ?? "a sender"} (*${c.trackingNumber}*) is on its way to you. Please standby.${c.trackUrl ? `\nTrack: ${c.trackUrl}` : ""}`,
  }),
  in_transit: (c) => ({
    subject: `In transit — ${c.trackingNumber}`,
    sms: `${COMPANY}: Your package ${c.trackingNumber} is now in transit.`,
    email: `Hi ${c.customerName ?? "there"},\n\nYour package ${c.trackingNumber} is now in transit${c.eta ? ` and expected to arrive around ${c.eta}` : ""}.\n\n— ${COMPANY}`,
    whatsapp: `✈️ *${COMPANY}*\n*${c.trackingNumber}* is in transit${c.eta ? `\nETA: ${c.eta}` : ""}.`,
  }),
  arrived: (c) => ({
    subject: `Arrived in Ghana — ${c.trackingNumber}`,
    sms: `${COMPANY}: Your package ${c.trackingNumber} has arrived in Ghana and is being cleared.`,
    email: `Hi ${c.customerName ?? "there"},\n\nYour package ${c.trackingNumber} has arrived in Ghana and is going through customs clearing. We'll let you know when it's ready for pickup/delivery.\n\n— ${COMPANY}`,
    whatsapp: `🛬 *${COMPANY}*\n*${c.trackingNumber}* has arrived in Ghana and is being cleared.`,
  }),
  ready_for_pickup: (c) => ({
    subject: `Ready for pickup — ${c.trackingNumber}`,
    sms: `${COMPANY}: Your package ${c.trackingNumber} is ready for pickup. Bring a valid ID. Contact ${c.supportPhone ?? "us"} for details.`,
    email: `Hi ${c.customerName ?? "there"},\n\nYour package ${c.trackingNumber} is ready for pickup. Please bring a valid ID.\n\n— ${COMPANY}`,
    whatsapp: `📍 *${COMPANY}*\n*${c.trackingNumber}* is ready for pickup. Please bring a valid ID.`,
  }),
  out_for_delivery: (c) => ({
    subject: `Out for delivery — ${c.trackingNumber}`,
    sms: `${COMPANY}: Your package ${c.trackingNumber} is out for delivery today.`,
    email: `Hi ${c.customerName ?? "there"},\n\nYour package ${c.trackingNumber} is out for delivery today. Please keep your phone reachable.\n\n— ${COMPANY}`,
    whatsapp: `🛵 *${COMPANY}*\n*${c.trackingNumber}* is out for delivery today.`,
  }),
  delivered: (c) => ({
    subject: `Delivered — ${c.trackingNumber}`,
    sms: `${COMPANY}: Your package ${c.trackingNumber} has been delivered. Thank you for shipping with us!`,
    email: `Hi ${c.customerName ?? "there"},\n\nYour package ${c.trackingNumber} has been delivered. Thank you for choosing ${COMPANY}!\n\nIf there's any issue, reply or contact ${c.supportEmail ?? "support"}.\n\n— ${COMPANY}`,
    whatsapp: `🎉 *${COMPANY}*\n*${c.trackingNumber}* has been delivered. Thank you!`,
  }),
  delay_notice: (c) => ({
    subject: `Delay update — ${c.trackingNumber}`,
    sms: `${COMPANY}: We're sorry — package ${c.trackingNumber} is experiencing a delay. New ETA: ${c.eta ?? "TBD"}. We appreciate your patience.`,
    email: `Hi ${c.customerName ?? "there"},\n\nWe want to keep you informed: package ${c.trackingNumber} is experiencing a delay.${c.eta ? ` Updated ETA: ${c.eta}.` : ""}\n\nWe're sorry for the inconvenience and appreciate your patience.\n\n— ${COMPANY}`,
    whatsapp: `⏳ *${COMPANY}*\nDelay on *${c.trackingNumber}*.${c.eta ? ` New ETA: ${c.eta}.` : ""} Thanks for your patience.`,
  }),
  complaint_update: (c) => ({
    subject: `Update on ticket ${c.ticketNumber}`,
    sms: `${COMPANY}: Update on your support ticket ${c.ticketNumber}: ${c.status ?? "in progress"}.`,
    email: `Hi ${c.customerName ?? "there"},\n\nThere's an update on your support ticket ${c.ticketNumber}: ${c.status ?? "in progress"}.\n\n— ${COMPANY}`,
    whatsapp: `💬 *${COMPANY}*\nTicket *${c.ticketNumber}* update: ${c.status ?? "in progress"}.`,
  }),
};

export function renderTemplate(event: NotificationEvent, ctx: TemplateContext): RenderedTemplate {
  return TEMPLATES[event](ctx);
}
