/**
 * Liberty & Liberty Logistics — Domain Model
 * ----------------------------------------------------------------------------
 * Single source of truth for every Firestore document shape in the platform.
 * Each interface maps 1:1 to a collection in `src/lib/db/collections.ts`.
 *
 * Conventions:
 *  - `id` is the Firestore document id (never stored in the doc body).
 *  - Money is stored as a plain number in the document's stated `currency`.
 *  - Timestamps are stored as ISO 8601 strings (the `ISODate` type), which sort
 *    chronologically and avoid Date/Timestamp conversion bugs across the
 *    client/server boundary.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type ISODate = string; // e.g. "2026-06-28T10:00:00.000Z"
export type CurrencyCode = "USD" | "GHS" | "NGN" | "EUR" | "GBP";

export interface AuditStamp {
  createdAt: ISODate;
  createdBy: string; // user id
  createdByName?: string;
  updatedAt?: ISODate;
  updatedBy?: string;
}

// ---------------------------------------------------------------------------
// Roles & Users
// ---------------------------------------------------------------------------

export type Role =
  | "liberty_super_admin"
  | "liberty_admin"
  | "seal_admin"
  | "seal_supervisor"
  | "seal_intake"
  | "seal_staff"
  | "finance_user"
  | "customer";

export type Organization = "liberty" | "seal" | "customer";

export interface AppUser extends AuditStamp {
  id: string; // matches Firebase Auth uid
  email: string;
  displayName: string;
  phone?: string;
  role: Role;
  organization: Organization;
  /** SEAL office this user is attached to (for seal_admin / seal_staff). */
  sealOffice?: string;
  /** For customer-role logins, the linked customer document id. */
  customerId?: string;
  active: boolean;
  lastLoginAt?: ISODate;
  photoURL?: string;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export type CustomerType =
  | "individual"
  | "trader"
  | "student"
  | "church"
  | "institution"
  | "business"
  | "online_seller";

export type CustomerSource =
  | "liberty"
  | "seal"
  | "referral"
  | "walk_in"
  | "online"
  | "campaign";

export interface ContactParty {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  city?: string;
}

/** A saved address in a customer's address book. */
export interface CustomerAddress {
  id: string;
  label: string; // e.g. "Home", "Office", "Accra shop"
  contactName?: string;
  phone?: string;
  line1: string;
  city?: string;
  region?: string;
  postal?: string;
  country: string;
  isDefault?: boolean;
}

export interface Customer extends AuditStamp {
  id: string;
  customerCode: string; // human-friendly e.g. LCM-C-00123
  fullName: string;
  phone: string;
  email?: string;
  country: string;
  address?: string;
  city?: string;
  /** Saved address book — multiple delivery / pickup addresses. */
  addresses?: CustomerAddress[];
  /** Default sender & receiver, pre-filled when creating shipments. */
  defaultSender?: ContactParty;
  defaultReceiver?: ContactParty;
  idVerification?: {
    type?: "ghana_card" | "passport" | "drivers_license" | "national_id" | "other";
    number?: string;
    documentUrl?: string;
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: ISODate;
  };
  customerType: CustomerType;
  source: CustomerSource;
  referredBy?: string;
  notes?: string;
  /** Per-channel notification opt-in. Undefined = email + sms + in-app. */
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  /** Denormalised counters kept in sync by the shipment repository. */
  shipmentCount: number;
  totalSpend: number;
  /** Ownership guard — Liberty always owns the customer record. */
  ownedBy: "liberty";
  active: boolean;
}

// ---------------------------------------------------------------------------
// Rate Cards (SEAL controls pricing for the pilot)
// ---------------------------------------------------------------------------

/** Mode of carriage. Air = weight/item priced (legacy default). Sea = volume (CBM) + standard units. */
export type CargoType = "air" | "sea";

export type PricingType =
  | "item_based"
  | "weight_based"
  | "sea_freight"
  | "service_fee"
  | "special_handling";

export type RateCardStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "expired"
  | "rejected";

export interface RateItem {
  /** Stable key used by shipments to reference an item price. */
  key: string;
  label: string;
  condition?: "new" | "used" | "any";
  unitPrice: number;
  /**
   * Unit the price is expressed in: "lb"/"kg" for weight, "cbm" for sea volume,
   * "unit" for a defined box/drum, "item" otherwise. For weight pricing this is
   * price PER POUND.
   */
  perUnit?: "item" | "lb" | "kg" | "cbm" | "unit";
}

export interface RateChangeLogEntry {
  at: ISODate;
  by: string;
  byName?: string;
  action: string; // e.g. "created", "submitted", "approved", "price_changed"
  field?: string;
  oldValue?: string | number;
  newValue?: string | number;
  reason?: string;
}

export interface RateCard extends AuditStamp {
  id: string;
  name: string;
  pricingType: PricingType;
  /** Route this card applies to, e.g. "USA-GHANA". Empty = applies to all. */
  route?: string;
  country?: string;
  currency: CurrencyCode;
  items: RateItem[];
  /** Weight pricing convenience: price per lb when pricingType is weight_based. */
  pricePerLb?: number;
  /** Sea pricing convenience: price per CBM (m³) when pricingType is sea_freight. */
  pricePerCbm?: number;
  /** Minimum billable CBM for sea_freight (e.g. bill at least 1 CBM). */
  minimumCbm?: number;
  /** Service-fee config when pricingType is service_fee. */
  serviceFee?: {
    amount: number;
    /** Routes / countries where this fee is waived (e.g. Nigeria). */
    waivedForCountries: string[];
    enabled: boolean;
  };
  effectiveDate: ISODate;
  expiryDate?: ISODate;
  status: RateCardStatus;
  version: number;
  uploadedBy: string;
  uploadedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvalDate?: ISODate;
  rejectionReason?: string;
  changeLog: RateChangeLogEntry[];
}

// ---------------------------------------------------------------------------
// Country Routes
// ---------------------------------------------------------------------------

export type RouteDirection =
  | "usa_to_country"
  | "country_to_usa"
  | "ghana_to_country"
  | "country_to_ghana";

export type RouteStatus = "draft" | "testing" | "active" | "suspended";

export interface CountryRoute extends AuditStamp {
  id: string;
  code: string; // e.g. "USA-GHANA"
  countryName: string;
  countryCode: string; // ISO-2, e.g. "GH"
  direction: RouteDirection;
  pricingType: PricingType;
  /** Air or sea route. Undefined = air (legacy). Sea routes carry CBM/unit pricing + long transit. */
  cargoType?: CargoType;
  defaultRate?: number;
  /** Sea routes: fallback price per CBM when no sea rate card matches. */
  defaultRatePerCbm?: number;
  currency: CurrencyCode;
  transitTimeDays?: number;
  prohibitedItems: string[];
  requiredDocuments: string[];
  customsProcess?: string;
  deliveryCoverage?: string;
  sealConfirmed: boolean;
  sealConfirmedBy?: string;
  sealConfirmedAt?: ISODate;
  libertyApproved: boolean;
  libertyApprovedBy?: string;
  libertyApprovedAt?: ISODate;
  status: RouteStatus;
  /** Service fee applies on this route (false e.g. for Nigeria). */
  serviceFeeApplies: boolean;
}

// ---------------------------------------------------------------------------
// Shipments & Packages
// ---------------------------------------------------------------------------

export type ShipmentStatus =
  | "draft"
  | "awaiting_package"
  | "received_by_seal"
  | "inspected"
  | "invoice_generated"
  | "payment_pending"
  | "payment_confirmed"
  | "added_to_manifest"
  | "ready_for_dispatch"
  | "dispatched"
  | "in_transit"
  | "arrived_ghana"
  // --- Sea-specific milestones (dedicated ocean-freight lifecycle) ---
  | "loaded_into_container"
  | "container_sealed"
  | "vessel_departed"
  | "at_sea"
  | "arrived_at_port"
  | "customs_clearing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "issue_reported"
  | "cancelled"
  | "consolidated"; // a source package merged into a consolidated shipment

export type SealHandlingStatus =
  | "not_started"
  | "awaiting_intake"
  | "intake_complete"
  | "manifested"
  | "dispatched"
  | "delivered";

export type LibertyHandlingStatus =
  | "created"
  | "invoiced"
  | "payment_tracking"
  | "ghana_delivery_prep"
  | "completed";

export type PackageCondition = "new" | "used" | "refurbished" | "mixed";
export type PaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "confirmed"
  | "refunded";

export interface ShipmentItem {
  /** References a RateItem.key for item-based pricing. */
  rateKey?: string;
  category: string; // e.g. "phone", "laptop", "general"
  itemType: string; // e.g. "New iPhone"
  condition: "new" | "used" | "any";
  quantity: number;
  description?: string;
  declaredValue?: number;
}

// ---------------------------------------------------------------------------
// Sea cargo composition (CBM-measured loose cargo + standard units)
// ---------------------------------------------------------------------------

/** A loose piece measured by dimensions; CBM = L×W×H (cm) ÷ 1,000,000 × quantity. */
export interface SeaVolumetricPiece {
  id: string;
  label?: string; // e.g. "Wooden crate"
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  quantity: number; // number of identical pieces
}

/** A standard unit (box / drum / barrel) priced at a flat per-unit rate. */
export interface SeaUnitPiece {
  id: string;
  /** References a sea RateItem.key, e.g. "drum_200l". */
  unitKey: string;
  label: string; // snapshot label, e.g. "200L Drum"
  quantity: number;
}

/**
 * Sea cargo for a shipment. A single shipment may MIX loose (volumetric) cargo
 * priced by CBM and standard units priced per box/drum — both bill on one invoice.
 */
export interface SeaCargo {
  volumetric: SeaVolumetricPiece[];
  units: SeaUnitPiece[];
}

export interface ShipmentStatusEvent {
  status: ShipmentStatus;
  at: ISODate;
  by: string;
  byName?: string;
  note?: string;
  location?: string;
}

export interface Shipment extends AuditStamp {
  id: string;
  trackingNumber: string; // auto-generated, e.g. LCM-2606-AB12CD
  customerId: string;
  customerName: string;
  sender: ContactParty;
  receiver: ContactParty;
  originCountry: string;
  destinationCountry: string;
  routeCode: string;
  /** Air (weight/item priced) or Sea (CBM + units). Undefined = air (legacy). */
  cargoType?: CargoType;
  pricingMode: "item_based" | "weight_based";
  items: ShipmentItem[];
  /** Physical measurements (entered at intake by SEAL). */
  weightLb?: number;
  /** Number of physical packages/boxes — drives how many labels are printed. */
  pieces?: number;
  dimensions?: { lengthIn?: number; widthIn?: number; heightIn?: number };
  volumetricWeightLb?: number;
  /** Sea cargo composition (when cargoType === "sea"). */
  seaCargo?: SeaCargo;
  /** Total chargeable volume in CBM, computed from seaCargo at intake. */
  totalCbm?: number;
  declaredValue?: number;
  packageDescription?: string;
  packageCondition?: PackageCondition;
  photoUrls: string[];
  documentUrls: string[];
  paymentStatus: PaymentStatus;
  status: ShipmentStatus;
  sealHandlingStatus: SealHandlingStatus;
  libertyHandlingStatus: LibertyHandlingStatus;
  assignedSealOffice?: string;
  manifestId?: string;
  invoiceId?: string;
  /** Consolidation — set on the consolidated parent shipment. */
  isConsolidated?: boolean;
  consolidationNumber?: string; // e.g. LCM-CON-000123
  consolidatedFrom?: string[]; // source shipment ids merged into this one
  /** Set on each source package, pointing at the consolidated parent. */
  consolidatedInto?: string;
  expectedDeliveryDate?: ISODate;
  actualDeliveryDate?: ISODate;
  statusHistory: ShipmentStatusEvent[];
  /** Set true once Super Admin locks a completed record (read-only). */
  locked: boolean;
  /** Records an admin override of a dispatch guard, with reason. */
  dispatchOverride?: { by: string; byName?: string; at: ISODate; reason: string };
  /** Proof of delivery captured at the final delivered step. */
  deliveryProof?: {
    recipientName: string;
    photoUrls: string[];
    signatureDataUrl?: string;
    note?: string;
    by: string;
    byName?: string;
    at: ISODate;
  };
}

// ---------------------------------------------------------------------------
// Customer self-service requests (pickup / ship-to-warehouse)
// ---------------------------------------------------------------------------

/** What the customer is asking us to do. */
export type RequestType = "pickup" | "ship_to_warehouse";

export type RequestStatus =
  | "submitted" // customer just created it
  | "in_review" // staff are looking at it
  | "scheduled" // pickup booked / awaiting parcel at the warehouse
  | "received" // parcel collected or arrived at the hub
  | "converted" // turned into a tracked shipment
  | "completed"
  | "cancelled";

export interface RequestStatusEvent {
  status: RequestStatus;
  at: ISODate;
  by: string;
  byName?: string;
  note?: string;
}

/**
 * A lightweight, customer-initiated request. Customers can create these with a
 * short form; staff triage them in a queue and convert them into full
 * Shipments. Kept deliberately separate from the strict Shipment lifecycle so
 * the customer experience stays simple.
 */
export interface ShipmentRequest extends AuditStamp {
  id: string;
  requestNumber: string; // e.g. LCM-REQ-000123
  type: RequestType;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  status: RequestStatus;

  // What is being moved
  /** Preferred mode of carriage. Undefined = air (default). */
  cargoType?: CargoType;
  packageDescription: string;
  pieces?: number;
  approxWeightLb?: number;
  declaredValue?: number;
  destinationCountry?: string;
  receiver?: ContactParty;

  // Pickup-specific (type === "pickup")
  pickup?: {
    address: string;
    city?: string;
    country: string;
    contactPhone?: string;
    preferredDate?: ISODate;
    preferredWindow?: "morning" | "afternoon" | "evening";
  };

  // Ship-to-warehouse specific (type === "ship_to_warehouse")
  inbound?: {
    warehouse: string; // hub key, e.g. "usa" | "ghana"
    carrier?: string; // UPS / USPS / Amazon / etc.
    carrierTracking?: string;
    expectedArrival?: ISODate;
  };

  notes?: string;
  photoUrls: string[];
  linkedShipmentId?: string;
  statusHistory: RequestStatusEvent[];
  handledBy?: string;
  handledByName?: string;
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export interface InvoiceLine {
  description: string;
  type: "item" | "weight" | "cbm" | "unit" | "service_fee" | "special_handling" | "adjustment";
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice extends AuditStamp {
  id: string;
  invoiceNumber: string; // e.g. LCM-INV-000123
  shipmentId: string;
  trackingNumber: string;
  customerId: string;
  customerName: string;
  routeCode: string;
  currency: CurrencyCode;
  lines: InvoiceLine[];
  subtotal: number;
  serviceFee: number;
  additionalCharges: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  /** Snapshot of the rate card used so the invoice is reproducible. */
  rateCardId: string;
  rateCardName: string;
  rateCardEffectiveDate: ISODate;
  paymentInstructions?: string;
  notes?: string;
  generatedBy: string;
  generatedByName?: string;
  /** Commission/fee breakdown computed at generation time. */
  commission?: CommissionBreakdown;
}

// ---------------------------------------------------------------------------
// Commission / Platform fee
// ---------------------------------------------------------------------------

export interface CommissionBreakdown {
  sealCharge: number; // what SEAL earns (the rated price)
  serviceFee: number;
  libertyCommission: number; // Liberty's % cut
  platformFee: number; // fixed per-shipment fee
  libertyEarnings: number; // commission + platformFee
  basis: string; // human-readable explanation
}

// ---------------------------------------------------------------------------
// Manifests
// ---------------------------------------------------------------------------

export type ManifestStatus =
  | "draft"
  | "pending_liberty_approval"
  | "approved"
  | "confirmed_by_seal"
  | "dispatched"
  | "arrived"
  | "closed";

export type ContainerType = "20ft" | "40ft" | "40ft_hc";

export interface ManifestPackage {
  shipmentId: string;
  trackingNumber: string;
  customerName: string;
  description: string;
  weightLb: number;
  /** Sea cargo volume for this package (CBM); 0/undefined for air. */
  cbm?: number;
  /** Carriage mode of the source shipment (drives sea container totals). */
  cargoType?: CargoType;
  declaredValue: number;
  paymentStatus: PaymentStatus;
}

export interface Manifest extends AuditStamp {
  id: string;
  manifestNumber: string; // e.g. LCM-MF-000045
  /** Air manifest or sea container loading list. Undefined = air (legacy). */
  cargoType?: CargoType;
  /** Sea: container identity + capacity for FCL/LCL fill tracking. */
  containerNumber?: string;
  containerType?: ContainerType;
  loadType?: "fcl" | "lcl";
  capacityCbm?: number;
  totalCbm?: number;
  routeCode: string;
  origin: string;
  destination: string;
  sealOffice?: string;
  dispatchDate?: ISODate;
  expectedArrivalDate?: ISODate;
  packages: ManifestPackage[];
  totalPackages: number;
  totalWeightLb: number;
  totalDeclaredValue: number;
  status: ManifestStatus;
  preparedBy: string;
  preparedByName?: string;
  libertyApprovedBy?: string;
  libertyApprovedByName?: string;
  libertyApprovedAt?: ISODate;
  sealConfirmedBy?: string;
  sealConfirmedByName?: string;
  sealConfirmedAt?: ISODate;
}

// ---------------------------------------------------------------------------
// Payments & Reconciliation
// ---------------------------------------------------------------------------

export type PaymentMethod =
  | "cash"
  | "mobile_money"
  | "bank_transfer"
  | "card"
  | "paystack"
  | "paypal"
  | "zelle"
  | "cashapp"
  | "other";

/** Online gateways that confirm payment instantly and auto-reconcile. */
export const GATEWAY_METHODS: PaymentMethod[] = ["paystack", "paypal"];

export type ReconciliationStatus =
  | "unreconciled"
  | "reconciled"
  | "disputed";

export interface Payment extends AuditStamp {
  id: string;
  receiptNumber: string; // e.g. LCM-PAY-000123
  invoiceId: string;
  invoiceNumber: string;
  shipmentId: string;
  customerId: string;
  customerName: string;
  currency: CurrencyCode;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paymentDate: ISODate;
  recordedBy: string;
  recordedByName?: string;
  reconciliationStatus: ReconciliationStatus;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Complaints / Claims
// ---------------------------------------------------------------------------

export type ComplaintType =
  | "lost_package"
  | "damaged_package"
  | "delayed_shipment"
  | "wrong_item"
  | "wrong_destination"
  | "payment_dispute"
  | "customs_issue";

export type ComplaintStatus =
  | "open"
  | "in_review"
  | "awaiting_customer"
  | "resolved"
  | "closed";

export interface Complaint extends AuditStamp {
  id: string;
  ticketNumber: string; // e.g. LCM-TKT-000123
  customerId?: string;
  customerName?: string;
  shipmentId?: string;
  trackingNumber?: string;
  type: ComplaintType;
  description: string;
  attachmentUrls: string[];
  assignedTo?: string;
  assignedToName?: string;
  status: ComplaintStatus;
  resolutionNotes?: string;
  closedAt?: ISODate;
  priority: "low" | "medium" | "high";
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationChannel = "email" | "sms" | "whatsapp" | "in_app";

export type NotificationEvent =
  | "package_received"
  | "invoice_generated"
  | "payment_confirmed"
  | "added_to_manifest"
  | "dispatched"
  | "in_transit"
  | "arrived"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "delay_notice"
  | "complaint_update"
  | "recipient_incoming"; // to the consignee: a package is on its way to you

export interface NotificationRecord extends AuditStamp {
  id: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipientUserId?: string;
  recipientName?: string;
  recipientAddress: string; // email / phone
  subject?: string;
  body: string;
  shipmentId?: string;
  status: "queued" | "sent" | "failed" | "read";
  error?: string;
  read: boolean;
  sentAt?: ISODate;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export type AuditAction =
  | "rate_change"
  | "rate_approved"
  | "rate_rejected"
  | "shipment_create"
  | "shipment_edit"
  | "shipment_status_change"
  | "payment_update"
  | "manifest_approval"
  | "manifest_create"
  | "user_login"
  | "user_create"
  | "record_delete"
  | "record_cancel"
  | "admin_override"
  | "settings_change"
  | "data_export"
  | "customer_create"
  | "invoice_generate";

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entity: string; // collection name
  entityId?: string;
  userId: string;
  userName?: string;
  userRole?: Role;
  field?: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  reason?: string;
  at: ISODate;
  ip?: string;
}

// ---------------------------------------------------------------------------
// Settings (commission / platform fee + service fee rules)
// ---------------------------------------------------------------------------

export interface CommissionRule {
  /** Match on any combination; undefined fields are wildcards. */
  customerSource?: CustomerSource;
  routeCode?: string;
  itemCategory?: string;
  commissionPercent: number; // applied to SEAL charge
  platformFeePerShipment: number; // fixed fee
  note?: string;
}

/** A payout destination shown on invoices so customers can pay. */
export interface PayoutAccount {
  id: string;
  type: "mobile_money" | "bank_transfer" | "zelle" | "cashapp" | "other";
  label: string; // e.g. "MTN MoMo (Ghana)"
  accountName?: string;
  accountNumber?: string;
  bankOrProvider?: string;
  instructions?: string;
  enabled: boolean;
}

export interface PlatformSettings extends AuditStamp {
  id: "platform"; // single document
  companyName: string;
  defaultCurrency: CurrencyCode;
  defaultCommissionPercent: number;
  defaultPlatformFeePerShipment: number;
  monthlySupportFee: number;
  commissionRules: CommissionRule[];
  /** Per-route service fee toggles (route code -> enabled). */
  serviceFeeByRoute: Record<string, boolean>;
  serviceFeeAmount: number;
  paymentInstructions: string;
  /** Bank / mobile-money / Zelle accounts rendered on invoices. */
  payoutAccounts: PayoutAccount[];
  dispatchGuards: {
    requirePhoto: boolean;
    requireWeight: boolean;
    requireInvoice: boolean;
    requirePaymentConfirmed: boolean;
    requireManifest: boolean;
  };
}

// ---------------------------------------------------------------------------
// Six-Month Pilot Tracker
// ---------------------------------------------------------------------------

export type PilotRecommendation =
  | "continue"
  | "renegotiate"
  | "expand"
  | "terminate"
  | "undecided";

export interface PilotTracker extends AuditStamp {
  id: "pilot"; // single document
  startDate: ISODate;
  endDate: ISODate;
  activeRoutes: string[];
  countriesOnboarded: string[];
  /** Snapshot metrics — refreshed by reports; can be overridden manually. */
  notes?: string;
  recommendation: PilotRecommendation;
  recommendationNotes?: string;
}
