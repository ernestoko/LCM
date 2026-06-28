import type {
  ShipmentStatus,
  PaymentStatus,
  RateCardStatus,
  ManifestStatus,
  RouteStatus,
  ComplaintStatus,
  ComplaintType,
  CustomerType,
  CustomerSource,
  PricingType,
  RouteDirection,
  PaymentMethod,
  RequestStatus,
  RequestType,
  CargoType,
} from "@/types";

/** Tailwind badge tone keyed by a small semantic vocabulary. */
export type BadgeTone =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "purple"
  | "gold";

export interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

// ---------------------------------------------------------------------------
// Shipment status — ordered lifecycle used by the status flow component.
// ---------------------------------------------------------------------------

/** Air freight (default) lifecycle. */
export const SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
  "draft",
  "awaiting_package",
  "received_by_seal",
  "inspected",
  "invoice_generated",
  "payment_pending",
  "payment_confirmed",
  "added_to_manifest",
  "ready_for_dispatch",
  "dispatched",
  "in_transit",
  "arrived_ghana",
  "customs_clearing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
];

/**
 * Dedicated ocean-freight lifecycle. Shares the intake/invoice/payment front
 * half, then diverges into container loading, sailing and port arrival before
 * customs and delivery.
 */
export const SEA_SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
  "draft",
  "awaiting_package",
  "received_by_seal",
  "inspected",
  "invoice_generated",
  "payment_pending",
  "payment_confirmed",
  "added_to_manifest",
  "loaded_into_container",
  "container_sealed",
  "vessel_departed",
  "at_sea",
  "arrived_at_port",
  "customs_clearing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
];

/** The lifecycle order for a shipment's cargo type (sea or air/default). */
export function shipmentStatusOrder(cargoType?: CargoType): ShipmentStatus[] {
  return cargoType === "sea" ? SEA_SHIPMENT_STATUS_ORDER : SHIPMENT_STATUS_ORDER;
}

export const SHIPMENT_STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  awaiting_package: { label: "Awaiting Package", tone: "warning" },
  received_by_seal: { label: "Received by Operations", tone: "info" },
  inspected: { label: "Inspected", tone: "info" },
  invoice_generated: { label: "Invoice Generated", tone: "purple" },
  payment_pending: { label: "Payment Pending", tone: "warning" },
  payment_confirmed: { label: "Payment Confirmed", tone: "success" },
  added_to_manifest: { label: "Added to Manifest", tone: "info" },
  ready_for_dispatch: { label: "Ready for Dispatch", tone: "gold" },
  dispatched: { label: "Dispatched", tone: "info" },
  in_transit: { label: "In Transit", tone: "info" },
  arrived_ghana: { label: "Arrived in Ghana", tone: "info" },
  // Sea-specific milestones
  loaded_into_container: { label: "Loaded into Container", tone: "info" },
  container_sealed: { label: "Container Sealed", tone: "purple" },
  vessel_departed: { label: "Vessel Departed", tone: "info" },
  at_sea: { label: "At Sea", tone: "info" },
  arrived_at_port: { label: "Arrived at Port", tone: "info" },
  customs_clearing: { label: "Customs / Clearing", tone: "warning" },
  ready_for_pickup: { label: "Ready for Pickup", tone: "gold" },
  out_for_delivery: { label: "Out for Delivery", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  issue_reported: { label: "Issue Reported", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "danger" },
  consolidated: { label: "Consolidated", tone: "purple" },
};

/** Statuses that count as "active" (in the pipeline, not closed) — across air & sea. */
export const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] = Array.from(
  new Set([...SHIPMENT_STATUS_ORDER, ...SEA_SHIPMENT_STATUS_ORDER]),
).filter((s) => s !== "delivered" && s !== "draft");

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  unpaid: { label: "Unpaid", tone: "danger" },
  partial: { label: "Partial", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  confirmed: { label: "Confirmed", tone: "success" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const RATE_CARD_STATUS_META: Record<RateCardStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_approval: { label: "Pending Approval", tone: "warning" },
  active: { label: "Active", tone: "success" },
  expired: { label: "Expired", tone: "neutral" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const MANIFEST_STATUS_META: Record<ManifestStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_liberty_approval: { label: "Pending Liberty Approval", tone: "warning" },
  approved: { label: "Liberty Approved", tone: "info" },
  confirmed_by_seal: { label: "Confirmed by Operations", tone: "purple" },
  dispatched: { label: "Dispatched", tone: "info" },
  arrived: { label: "Arrived", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

export const ROUTE_STATUS_META: Record<RouteStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  testing: { label: "Testing", tone: "warning" },
  active: { label: "Active", tone: "success" },
  suspended: { label: "Suspended", tone: "danger" },
};

export const COMPLAINT_STATUS_META: Record<ComplaintStatus, StatusMeta> = {
  open: { label: "Open", tone: "danger" },
  in_review: { label: "In Review", tone: "warning" },
  awaiting_customer: { label: "Awaiting Customer", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  lost_package: "Lost Package",
  damaged_package: "Damaged Package",
  delayed_shipment: "Delayed Shipment",
  wrong_item: "Wrong Item",
  wrong_destination: "Wrong Destination",
  payment_dispute: "Payment Dispute",
  customs_issue: "Customs Issue",
};

export const REQUEST_STATUS_META: Record<RequestStatus, StatusMeta> = {
  submitted: { label: "Submitted", tone: "info" },
  in_review: { label: "In Review", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "purple" },
  received: { label: "Received", tone: "info" },
  converted: { label: "Converted to Shipment", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  pickup: "Pickup",
  ship_to_warehouse: "Ship to Warehouse",
};

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  individual: "Individual",
  trader: "Trader",
  student: "Student",
  church: "Church",
  institution: "Institution",
  business: "Business",
  online_seller: "Online Seller",
};

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  liberty: "Liberty",
  seal: "Partner",
  referral: "Referral",
  walk_in: "Walk-in",
  online: "Online",
  campaign: "Campaign",
};

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  item_based: "Item-based",
  weight_based: "Weight-based",
  sea_freight: "Sea freight (CBM / units)",
  service_fee: "Service Fee",
  special_handling: "Special Handling",
};

export const ROUTE_DIRECTION_LABELS: Record<RouteDirection, string> = {
  usa_to_country: "USA → Country",
  country_to_usa: "Country → USA",
  ghana_to_country: "Ghana → Country",
  country_to_ghana: "Country → Ghana",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
  card: "Card",
  paystack: "Paystack",
  paypal: "PayPal",
  zelle: "Zelle",
  cashapp: "Cash App",
  other: "Other",
};

/** Generic helper for badge components that don't know their enum at compile time. */
export function statusLabel(meta: StatusMeta | undefined, fallback: string): string {
  return meta?.label ?? fallback;
}
