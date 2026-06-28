/**
 * Liberty Cargo Movers — Demo Data Generator
 * ----------------------------------------------------------------------------
 * Populates a freshly-seeded platform with realistic, end-to-end demo data so
 * the owner sees a fully-working dashboard immediately:
 *   • ~12 customers (mixed types / sources / destinations)
 *   • ~30 shipments spread across the whole lifecycle
 *   • Invoices (priced via the real pricing engine) for invoiced+ shipments
 *   • Payments for confirmed / delivered shipments
 *   • 2 manifests (one dispatched, one approved)
 *   • 3–4 complaints linked to shipments
 *   • Denormalised customer counters refreshed at the end
 *
 * Deterministic & idempotent: every document uses a fixed `demo-*` id and is
 * written with `{ merge: true }`, so re-running simply refreshes the data.
 *
 * Run:  npm run seed:demo   (after `npm run seed`)
 * Requires FIREBASE_ADMIN_* env vars in .env.local.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import {
  formatInvoiceNumber,
  formatPaymentNumber,
  formatManifestNumber,
  formatTicketNumber,
  formatCustomerCode,
  generateTrackingNumber,
  routeCode,
} from "../src/lib/utils/ids";
import { calculatePricing, selectActiveRateCard } from "../src/lib/pricing/engine";
import type { PricingContext } from "../src/lib/pricing/engine";
import type {
  Customer,
  CustomerType,
  CustomerSource,
  Shipment,
  ShipmentStatus,
  ShipmentItem,
  ShipmentStatusEvent,
  SealHandlingStatus,
  LibertyHandlingStatus,
  PaymentStatus,
  Invoice,
  InvoiceLine,
  Payment,
  PaymentMethod,
  ReconciliationStatus,
  Manifest,
  ManifestPackage,
  ManifestStatus,
  Complaint,
  ComplaintType,
  ComplaintStatus,
  RateCard,
  CountryRoute,
  PlatformSettings,
} from "../src/types";

// --- Load .env.local (no dotenv dependency) --------------------------------
function loadEnv() {
  try {
    const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of file.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let [, key, val] = m;
      val = val.replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn("⚠️  No .env.local found — relying on existing environment variables.");
  }
}
loadEnv();

const nowISO = () => new Date().toISOString();
/** ISO timestamp `n` days ago (deterministic spread over the pilot window). */
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const ACTOR = { uid: "seed-demo", name: "Liberty Operations" };
const SEAL_OFFICE = "SEAL Minnesota";
const PHOTO_URL =
  "https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?auto=format&fit=crop&w=640&q=60";

function initAdmin() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const projectId =
      process.env.GCLOUD_PROJECT || process.env.FIREBASE_ADMIN_PROJECT_ID || "demo-lcm";
    if (!getApps().length) initializeApp({ projectId });
    try {
      getFirestore().settings({ ignoreUndefinedProperties: true });
    } catch {
      /* settings() can only be called once */
    }
    return;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Missing FIREBASE_ADMIN_* env vars. Fill them in .env.local first.");
    process.exit(1);
  }
  if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  try {
    getFirestore().settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() can only be called once.
  }
}

// ---------------------------------------------------------------------------
// Static demo definitions
// ---------------------------------------------------------------------------

const GHANA = "Ghana";
const NIGERIA = "Nigeria";
const ORIGIN = "United States";

interface DemoCustomerDef {
  fullName: string;
  phone: string;
  email?: string;
  country: string;
  city?: string;
  customerType: CustomerType;
  source: CustomerSource;
}

const CUSTOMER_DEFS: DemoCustomerDef[] = [
  { fullName: "Kwame Mensah", phone: "+233244001122", email: "kwame.mensah@example.com", country: GHANA, city: "Accra", customerType: "individual", source: "liberty" },
  { fullName: "Ama Owusu", phone: "+233209887766", email: "ama.owusu@example.com", country: GHANA, city: "Kumasi", customerType: "trader", source: "online" },
  { fullName: "Kofi Boateng", phone: "+12025550143", email: "kofi.boateng@example.com", country: GHANA, city: "Tema", customerType: "individual", source: "referral" },
  { fullName: "Akua Sarpong", phone: "+233277445566", email: "akua.sarpong@example.com", country: GHANA, city: "Takoradi", customerType: "student", source: "walk_in" },
  { fullName: "Yaw Darko", phone: "+233244778899", email: "yaw.darko@example.com", country: GHANA, city: "Accra", customerType: "business", source: "seal" },
  { fullName: "Abena Ofori", phone: "+447911223344", email: "abena.ofori@example.com", country: GHANA, city: "Cape Coast", customerType: "individual", source: "liberty" },
  { fullName: "Kojo Asante", phone: "+12025550199", email: "kojo.asante@example.com", country: GHANA, city: "Accra", customerType: "online_seller", source: "online" },
  { fullName: "Efua Addo", phone: "+233208112233", email: "efua.addo@example.com", country: GHANA, city: "Koforidua", customerType: "church", source: "referral" },
  { fullName: "Chinedu Okafor", phone: "+2348031234567", email: "chinedu.okafor@example.com", country: NIGERIA, city: "Lagos", customerType: "trader", source: "online" },
  { fullName: "Ngozi Eze", phone: "+2348059876543", email: "ngozi.eze@example.com", country: NIGERIA, city: "Abuja", customerType: "individual", source: "liberty" },
  { fullName: "Grace Adjei Foundation", phone: "+233302765432", email: "ops@graceadjei.org", country: GHANA, city: "Accra", customerType: "institution", source: "liberty" },
  { fullName: "Samuel Quaye", phone: "+12025550177", email: "samuel.quaye@example.com", country: GHANA, city: "Accra", customerType: "individual", source: "walk_in" },
];

/** Default sender (US-side diaspora shipper) per customer index, cycled. */
const SENDERS = [
  { name: "Daniel Mensah", phone: "+16125550110", address: "412 Nicollet Mall", city: "Minneapolis", country: ORIGIN },
  { name: "Linda Owusu", phone: "+16515550120", address: "88 W 7th St", city: "St. Paul", country: ORIGIN },
  { name: "Patrick Boateng", phone: "+12025550130", address: "1500 K St NW", city: "Washington", country: ORIGIN },
  { name: "Sandra Darko", phone: "+17185550140", address: "260 Atlantic Ave", city: "Brooklyn", country: ORIGIN },
];

interface DemoShipmentDef {
  custIdx: number; // 0-based into CUSTOMER_DEFS
  status: ShipmentStatus;
  pricingMode: "item_based" | "weight_based";
  weightLb?: number;
  items?: ShipmentItem[];
  destination: string; // GHANA or NIGERIA
  description: string;
  ageDays: number; // how many days ago it was created
}

// Item helper — keys are SEED_ITEM_RATES keys.
const item = (
  rateKey: string,
  itemType: string,
  category: string,
  condition: "new" | "used" | "any",
  quantity = 1,
): ShipmentItem => ({ rateKey, itemType, category, condition, quantity });

const SHIPMENT_DEFS: DemoShipmentDef[] = [
  // --- draft (2) ---
  { custIdx: 0, status: "draft", pricingMode: "weight_based", weightLb: 14, destination: GHANA, description: "Assorted clothing & shoes", ageDays: 2 },
  { custIdx: 6, status: "draft", pricingMode: "item_based", items: [item("iphone_new", "New iPhone 15", "phone", "new", 1)], destination: GHANA, description: "Sealed iPhone box", ageDays: 1 },
  // --- awaiting_package (2) ---
  { custIdx: 1, status: "awaiting_package", pricingMode: "weight_based", weightLb: 22, destination: GHANA, description: "Kitchenware & foodstuff", ageDays: 4 },
  { custIdx: 9, status: "awaiting_package", pricingMode: "weight_based", weightLb: 30, destination: NIGERIA, description: "Baby supplies", ageDays: 3 },
  // --- received_by_seal (3) ---
  { custIdx: 2, status: "received_by_seal", pricingMode: "weight_based", weightLb: 18.5, destination: GHANA, description: "Books & stationery", ageDays: 8 },
  { custIdx: 3, status: "received_by_seal", pricingMode: "item_based", items: [item("laptop_other_used", "Used HP Laptop", "laptop", "used", 1), item("apple_watch_new", "New Apple Watch SE", "wearable", "new", 1)], destination: GHANA, description: "Electronics for school", ageDays: 7 },
  { custIdx: 7, status: "received_by_seal", pricingMode: "weight_based", weightLb: 41, destination: GHANA, description: "Church donation goods", ageDays: 9 },
  // --- invoice_generated (4) ---
  { custIdx: 0, status: "invoice_generated", pricingMode: "weight_based", weightLb: 12.3, destination: GHANA, description: "Personal effects", ageDays: 12 },
  { custIdx: 4, status: "invoice_generated", pricingMode: "item_based", items: [item("mac_laptop_new", "New MacBook Air", "laptop", "new", 1), item("airpods_new", "New AirPods Pro", "audio", "new", 2)], destination: GHANA, description: "Office equipment", ageDays: 11 },
  { custIdx: 8, status: "invoice_generated", pricingMode: "weight_based", weightLb: 27, destination: NIGERIA, description: "Trader stock — fabrics", ageDays: 13 },
  { custIdx: 5, status: "invoice_generated", pricingMode: "weight_based", weightLb: 9.8, destination: GHANA, description: "Gift parcel", ageDays: 10 },
  // --- payment_confirmed (3) ---
  { custIdx: 1, status: "payment_confirmed", pricingMode: "item_based", items: [item("iphone_used", "Used iPhone 13", "phone", "used", 2), item("ipad_new", "New iPad 10th gen", "tablet", "new", 1)], destination: GHANA, description: "Resale electronics", ageDays: 18 },
  { custIdx: 6, status: "payment_confirmed", pricingMode: "weight_based", weightLb: 33.5, destination: GHANA, description: "Online order — mixed goods", ageDays: 17 },
  { custIdx: 10, status: "payment_confirmed", pricingMode: "weight_based", weightLb: 55, destination: GHANA, description: "Foundation medical supplies", ageDays: 20 },
  // --- added_to_manifest (3) ---
  { custIdx: 2, status: "added_to_manifest", pricingMode: "weight_based", weightLb: 16, destination: GHANA, description: "Household items", ageDays: 24 },
  { custIdx: 3, status: "added_to_manifest", pricingMode: "item_based", items: [item("phone_other_new", "New Samsung A55", "phone", "new", 3)], destination: GHANA, description: "Phones for resale", ageDays: 23 },
  { custIdx: 11, status: "added_to_manifest", pricingMode: "weight_based", weightLb: 21.2, destination: GHANA, description: "Clothing parcel", ageDays: 22 },
  // --- in_transit (4) ---
  { custIdx: 0, status: "in_transit", pricingMode: "weight_based", weightLb: 19, destination: GHANA, description: "Personal effects", ageDays: 30 },
  { custIdx: 4, status: "in_transit", pricingMode: "item_based", items: [item("tablet_used", "Used Samsung Tab", "tablet", "used", 2)], destination: GHANA, description: "Refurbished tablets", ageDays: 29 },
  { custIdx: 7, status: "in_transit", pricingMode: "weight_based", weightLb: 47, destination: GHANA, description: "Church supplies", ageDays: 31 },
  { custIdx: 5, status: "in_transit", pricingMode: "weight_based", weightLb: 13.6, destination: GHANA, description: "Gift parcel", ageDays: 28 },
  // --- arrived_ghana (2) ---
  { custIdx: 1, status: "arrived_ghana", pricingMode: "weight_based", weightLb: 25, destination: GHANA, description: "Trader goods", ageDays: 38 },
  { custIdx: 11, status: "arrived_ghana", pricingMode: "item_based", items: [item("ipad_used", "Used iPad Air", "tablet", "used", 1)], destination: GHANA, description: "Single tablet", ageDays: 37 },
  // --- delivered (5) ---
  { custIdx: 0, status: "delivered", pricingMode: "weight_based", weightLb: 17.4, destination: GHANA, description: "Personal effects", ageDays: 48 },
  { custIdx: 2, status: "delivered", pricingMode: "item_based", items: [item("iphone_new", "New iPhone 15 Pro", "phone", "new", 1), item("airpods_used", "Used AirPods", "audio", "used", 1)], destination: GHANA, description: "Electronics", ageDays: 50 },
  { custIdx: 6, status: "delivered", pricingMode: "weight_based", weightLb: 28.9, destination: GHANA, description: "Online order", ageDays: 52 },
  { custIdx: 10, status: "delivered", pricingMode: "weight_based", weightLb: 60, destination: GHANA, description: "Foundation supplies", ageDays: 55 },
  { custIdx: 3, status: "delivered", pricingMode: "weight_based", weightLb: 11.1, destination: GHANA, description: "Student books", ageDays: 46 },
  // --- issue_reported (2) ---
  { custIdx: 4, status: "issue_reported", pricingMode: "weight_based", weightLb: 20, destination: GHANA, description: "Business samples (damaged)", ageDays: 40 },
  { custIdx: 8, status: "issue_reported", pricingMode: "weight_based", weightLb: 35, destination: NIGERIA, description: "Fabric stock (delayed)", ageDays: 42 },
];

// ---------------------------------------------------------------------------
// Status-derived sub-states
// ---------------------------------------------------------------------------

/** Lifecycle ordering used to decide what artifacts a shipment should have. */
const STATUS_ORDER: ShipmentStatus[] = [
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

function rank(s: ShipmentStatus): number {
  const i = STATUS_ORDER.indexOf(s);
  return i === -1 ? 0 : i; // issue_reported / cancelled treated as early
}

const atOrAfter = (s: ShipmentStatus, ref: ShipmentStatus) => rank(s) >= rank(ref);

function paymentStatusFor(s: ShipmentStatus): PaymentStatus {
  if (s === "payment_confirmed") return "confirmed";
  if (atOrAfter(s, "added_to_manifest")) return "paid";
  if (s === "invoice_generated") return "unpaid";
  return "unpaid";
}

function sealHandlingFor(s: ShipmentStatus): SealHandlingStatus {
  if (s === "delivered") return "delivered";
  if (atOrAfter(s, "in_transit")) return "dispatched";
  if (atOrAfter(s, "added_to_manifest")) return "manifested";
  if (atOrAfter(s, "received_by_seal")) return "intake_complete";
  if (s === "awaiting_package") return "awaiting_intake";
  return "not_started";
}

function libertyHandlingFor(s: ShipmentStatus): LibertyHandlingStatus {
  if (s === "delivered") return "completed";
  if (atOrAfter(s, "in_transit")) return "ghana_delivery_prep";
  if (atOrAfter(s, "payment_confirmed") || s === "payment_confirmed") return "payment_tracking";
  if (atOrAfter(s, "invoice_generated")) return "invoiced";
  return "created";
}

/** Build a 2–4 event status history ending at the current status. */
function buildHistory(status: ShipmentStatus, createdISO: string, destination: string): ShipmentStatusEvent[] {
  const ev = (s: ShipmentStatus, at: string, note?: string, location?: string): ShipmentStatusEvent => ({
    status: s,
    at,
    by: ACTOR.uid,
    byName: ACTOR.name,
    ...(note ? { note } : {}),
    ...(location ? { location } : {}),
  });
  const base = new Date(createdISO).getTime();
  const step = (d: number) => new Date(base + d * 86_400_000).toISOString();
  const hist: ShipmentStatusEvent[] = [ev("draft", step(0), "Shipment created", "Minneapolis, US")];

  if (atOrAfter(status, "received_by_seal") || status === "issue_reported") {
    hist.push(ev("received_by_seal", step(2), "Package received at SEAL Minnesota", SEAL_OFFICE));
  }
  if (atOrAfter(status, "invoice_generated") || status === "issue_reported") {
    hist.push(ev("invoice_generated", step(3), "Invoice generated", SEAL_OFFICE));
  }
  if (status === "payment_confirmed" || atOrAfter(status, "added_to_manifest")) {
    hist.push(ev("payment_confirmed", step(4), "Payment confirmed by Finance", SEAL_OFFICE));
  }
  if (atOrAfter(status, "added_to_manifest")) {
    hist.push(ev("added_to_manifest", step(5), "Added to outbound manifest", SEAL_OFFICE));
  }
  if (atOrAfter(status, "in_transit")) {
    hist.push(ev("in_transit", step(6), "Departed US hub", "Minneapolis, US"));
  }
  if (atOrAfter(status, "arrived_ghana")) {
    hist.push(ev("arrived_ghana", step(24), "Arrived Ghana hub", "Accra, GH"));
  }
  if (status === "delivered") {
    hist.push(ev("delivered", step(27), "Delivered to receiver", destination));
  }
  if (status === "issue_reported") {
    hist.push(ev("issue_reported", step(8), "Customer reported an issue", SEAL_OFFICE));
  }
  if (status === "awaiting_package") {
    hist.push(ev("awaiting_package", step(1), "Awaiting package drop-off", SEAL_OFFICE));
  }
  return hist;
}

const PAYMENT_METHODS: PaymentMethod[] = ["mobile_money", "zelle", "cash"];
const RECON: ReconciliationStatus[] = ["reconciled", "unreconciled", "reconciled", "disputed"];

const pad2 = (n: number) => String(n).padStart(2, "0");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  initAdmin();
  const db = getFirestore();

  console.log("\n🎬 Generating Liberty Cargo Movers DEMO data…\n");
  console.log("────────────────────────────────────────────");

  // 1. Load prerequisite seeded data ----------------------------------------
  console.log("📥 Reading seeded platform data…");
  const settingsSnap = await db.collection("settings").doc("platform").get();
  if (!settingsSnap.exists) {
    console.error("❌ settings/platform not found. Run `npm run seed` first.");
    process.exit(1);
  }
  const settings = settingsSnap.data() as PlatformSettings;

  const rateCardsSnap = await db.collection("rateCards").get();
  const rateCards = rateCardsSnap.docs.map((d) => d.data() as RateCard);
  const hasActive = rateCards.some((c) => c.status === "active");
  if (!hasActive) {
    console.error("❌ No active rate cards found. Run `npm run seed` first.");
    process.exit(1);
  }

  const routesSnap = await db.collection("countryRoutes").get();
  const routes = routesSnap.docs.map((d) => d.data() as CountryRoute);
  const routeByCode = new Map(routes.map((r) => [r.code, r] as const));

  console.log(`   • settings/platform ✓`);
  console.log(`   • rateCards: ${rateCards.length} (active: ${rateCards.filter((c) => c.status === "active").length})`);
  console.log(`   • countryRoutes: ${routes.length}`);

  // 2. Customers ------------------------------------------------------------
  console.log("\n👥 Customers");
  // (counters filled in step 9)
  const customerDocs: { id: string; data: Customer; def: DemoCustomerDef }[] = [];
  for (let i = 0; i < CUSTOMER_DEFS.length; i++) {
    const def = CUSTOMER_DEFS[i];
    const id = `demo-cust-${pad2(i + 1)}`;
    const createdISO = daysAgo(60 - i);
    const sender = SENDERS[i % SENDERS.length];
    const data: Customer = {
      id,
      customerCode: formatCustomerCode(i + 1),
      fullName: def.fullName,
      phone: def.phone,
      email: def.email,
      country: def.country,
      city: def.city,
      defaultSender: {
        name: sender.name,
        phone: sender.phone,
        address: sender.address,
        city: sender.city,
        country: sender.country,
      },
      defaultReceiver: {
        name: def.fullName,
        phone: def.phone,
        email: def.email,
        city: def.city,
        country: def.country,
      },
      customerType: def.customerType,
      source: def.source,
      shipmentCount: 0, // filled at the end
      totalSpend: 0, // filled at the end
      ownedBy: "liberty",
      active: true,
      createdAt: createdISO,
      createdBy: "seed-demo",
    };
    await db.collection("customers").doc(id).set(data, { merge: true });
    customerDocs.push({ id, data, def });
  }
  console.log(`   • ${customerDocs.length} customers written`);

  // Aggregators for the customer-counter refresh in step 9.
  const custShipmentCount = new Map<string, number>();
  const custSpend = new Map<string, number>();
  const bumpCount = (cid: string) => custShipmentCount.set(cid, (custShipmentCount.get(cid) ?? 0) + 1);
  const bumpSpend = (cid: string, amt: number) => custSpend.set(cid, (custSpend.get(cid) ?? 0) + amt);

  // 3. Shipments + invoices + payments --------------------------------------
  console.log("\n📦 Shipments (+ invoices + payments)");

  let invoiceSeq = 0;
  let paymentSeq = 0;

  // Track per-status counts + collections used by later steps.
  const statusCounts = new Map<ShipmentStatus, number>();
  const shipmentsForDispatchedManifest: { ship: Shipment }[] = []; // in_transit / arrived / delivered
  const shipmentsForOpenManifest: { ship: Shipment }[] = []; // added_to_manifest
  const createdShipments: Shipment[] = [];
  let invoiceCount = 0;
  let paymentCount = 0;

  for (let i = 0; i < SHIPMENT_DEFS.length; i++) {
    const def = SHIPMENT_DEFS[i];
    const cust = customerDocs[def.custIdx];
    const shipId = `demo-ship-${pad2(i + 1)}`;
    const createdISO = daysAgo(def.ageDays);
    const createdDate = new Date(createdISO);
    const route = `USA-${def.destination.toUpperCase().replace(/[^A-Z]/g, "")}`;
    const rcode = routeByCode.has(route) ? route : routeCode(ORIGIN, def.destination);
    const routeDoc = routeByCode.get(rcode) ?? null;
    const transitDays = routeDoc?.transitTimeDays ?? 21;

    const status = def.status;
    const isDelivered = status === "delivered";
    const isReceivedOrLater = atOrAfter(status, "received_by_seal") || status === "issue_reported";

    const items: ShipmentItem[] = def.items ?? [];
    bumpCount(cust.id);

    const shipment: Shipment = {
      id: shipId,
      trackingNumber: generateTrackingNumber(createdDate),
      customerId: cust.id,
      customerName: cust.data.fullName,
      sender: cust.data.defaultSender!,
      receiver: cust.data.defaultReceiver!,
      originCountry: ORIGIN,
      destinationCountry: def.destination,
      routeCode: rcode,
      pricingMode: def.pricingMode,
      items,
      weightLb: def.weightLb,
      declaredValue: def.pricingMode === "item_based" ? 800 : Math.round((def.weightLb ?? 0) * 25),
      packageDescription: def.description,
      packageCondition: "used",
      photoUrls: isReceivedOrLater ? [PHOTO_URL, PHOTO_URL] : [],
      documentUrls: [],
      paymentStatus: paymentStatusFor(status),
      status,
      sealHandlingStatus: sealHandlingFor(status),
      libertyHandlingStatus: libertyHandlingFor(status),
      assignedSealOffice: SEAL_OFFICE,
      expectedDeliveryDate: new Date(createdDate.getTime() + transitDays * 86_400_000).toISOString(),
      statusHistory: buildHistory(status, createdISO, def.destination),
      locked: false,
      createdAt: createdISO,
      createdBy: "seed-demo",
    };
    if (isDelivered) {
      shipment.actualDeliveryDate = new Date(createdDate.getTime() + (transitDays + 4) * 86_400_000).toISOString();
    }

    // --- Invoice (invoice_generated or later, but not pure issue early) -----
    const wantsInvoice = atOrAfter(status, "invoice_generated") || status === "issue_reported";
    if (wantsInvoice) {
      invoiceSeq += 1;
      const invId = `demo-inv-${pad2(invoiceSeq)}`;

      const itemCard = selectActiveRateCard(rateCards, "item_based", rcode, def.destination);
      const weightCard = selectActiveRateCard(rateCards, "weight_based", rcode, def.destination);
      const ctx: PricingContext = {
        itemRateCard: itemCard,
        weightRateCard: weightCard,
        route: routeDoc,
        settings,
      };
      const pricing = calculatePricing(
        {
          pricingMode: shipment.pricingMode,
          items: shipment.items,
          weightLb: shipment.weightLb,
          routeCode: shipment.routeCode,
          destinationCountry: shipment.destinationCountry,
          customerId: shipment.customerId,
          customerSource: cust.def.source,
        },
        ctx,
      );

      const isPaidLevel = status === "payment_confirmed" || atOrAfter(status, "added_to_manifest");
      const amountPaid = isPaidLevel ? pricing.total : 0;
      const invPayStatus: PaymentStatus = isPaidLevel ? "paid" : "unpaid";

      const lines: InvoiceLine[] = pricing.lines;
      const invoice: Invoice = {
        id: invId,
        invoiceNumber: formatInvoiceNumber(invoiceSeq),
        shipmentId: shipId,
        trackingNumber: shipment.trackingNumber,
        customerId: cust.id,
        customerName: cust.data.fullName,
        routeCode: rcode,
        currency: pricing.currency,
        lines,
        subtotal: pricing.subtotal,
        serviceFee: pricing.serviceFee,
        additionalCharges: pricing.additionalCharges,
        total: pricing.total,
        amountPaid,
        balanceDue: Math.max(0, pricing.total - amountPaid),
        paymentStatus: invPayStatus,
        rateCardId: pricing.rateCardId,
        rateCardName: pricing.rateCardName,
        rateCardEffectiveDate: pricing.rateCardEffectiveDate,
        paymentInstructions: settings.paymentInstructions,
        generatedBy: ACTOR.uid,
        generatedByName: ACTOR.name,
        commission: pricing.commission,
        createdAt: new Date(createdDate.getTime() + 3 * 86_400_000).toISOString(),
        createdBy: "seed-demo",
      };
      await db.collection("invoices").doc(invId).set(invoice, { merge: true });
      invoiceCount += 1;
      shipment.invoiceId = invId;

      // --- Payment (payment_confirmed / delivered, and anything past it) ----
      const wantsPayment = status === "payment_confirmed" || atOrAfter(status, "added_to_manifest");
      if (wantsPayment) {
        paymentSeq += 1;
        const payId = `demo-pay-${pad2(paymentSeq)}`;
        const method = PAYMENT_METHODS[paymentSeq % PAYMENT_METHODS.length];
        const recon = RECON[paymentSeq % RECON.length];
        const payment: Payment = {
          id: payId,
          receiptNumber: formatPaymentNumber(paymentSeq),
          invoiceId: invId,
          invoiceNumber: invoice.invoiceNumber,
          shipmentId: shipId,
          customerId: cust.id,
          customerName: cust.data.fullName,
          currency: pricing.currency,
          amount: pricing.total,
          method,
          reference: `${shipment.trackingNumber}`,
          paymentDate: new Date(createdDate.getTime() + 4 * 86_400_000).toISOString(),
          recordedBy: ACTOR.uid,
          recordedByName: ACTOR.name,
          reconciliationStatus: recon,
          createdAt: new Date(createdDate.getTime() + 4 * 86_400_000).toISOString(),
          createdBy: "seed-demo",
        };
        await db.collection("payments").doc(payId).set(payment, { merge: true });
        paymentCount += 1;
        bumpSpend(cust.id, pricing.total);
      }
    }

    await db.collection("shipments").doc(shipId).set(shipment, { merge: true });
    createdShipments.push(shipment);
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

    if (status === "in_transit" || status === "arrived_ghana" || status === "delivered") {
      if (shipment.destinationCountry === GHANA) shipmentsForDispatchedManifest.push({ ship: shipment });
    }
    if (status === "added_to_manifest") {
      shipmentsForOpenManifest.push({ ship: shipment });
    }
  }

  console.log(`   • ${createdShipments.length} shipments written`);
  console.log(`   • ${invoiceCount} invoices, ${paymentCount} payments written`);

  // 4. Manifests ------------------------------------------------------------
  console.log("\n🚚 Manifests");
  const ghanaRoute = routeByCode.get("USA-GHANA") ?? null;

  function toPackage(s: Shipment): ManifestPackage {
    return {
      shipmentId: s.id,
      trackingNumber: s.trackingNumber,
      customerName: s.customerName,
      description: s.packageDescription ?? "Package",
      weightLb: s.weightLb ?? 0,
      declaredValue: s.declaredValue ?? 0,
      paymentStatus: s.paymentStatus,
    };
  }

  function manifestTotals(pkgs: ManifestPackage[]) {
    return {
      totalPackages: pkgs.length,
      totalWeightLb: Math.round(pkgs.reduce((s, p) => s + p.weightLb, 0) * 100) / 100,
      totalDeclaredValue: Math.round(pkgs.reduce((s, p) => s + p.declaredValue, 0) * 100) / 100,
    };
  }

  async function writeManifest(opts: {
    id: string;
    seq: number;
    status: ManifestStatus;
    ships: Shipment[];
    dispatched: boolean;
    ageDays: number;
  }) {
    const pkgs = opts.ships.map(toPackage);
    const totals = manifestTotals(pkgs);
    const createdISO = daysAgo(opts.ageDays);
    const dispatchDate = opts.dispatched
      ? new Date(new Date(createdISO).getTime() + 2 * 86_400_000).toISOString()
      : undefined;
    const expectedArrival = dispatchDate
      ? new Date(new Date(dispatchDate).getTime() + (ghanaRoute?.transitTimeDays ?? 21) * 86_400_000).toISOString()
      : undefined;

    const manifest: Manifest = {
      id: opts.id,
      manifestNumber: formatManifestNumber(opts.seq),
      routeCode: "USA-GHANA",
      origin: ORIGIN,
      destination: GHANA,
      sealOffice: SEAL_OFFICE,
      dispatchDate,
      expectedArrivalDate: expectedArrival,
      packages: pkgs,
      ...totals,
      status: opts.status,
      preparedBy: ACTOR.uid,
      preparedByName: ACTOR.name,
      createdAt: createdISO,
      createdBy: "seed-demo",
    };
    if (opts.status === "dispatched" || opts.status === "approved") {
      manifest.libertyApprovedBy = ACTOR.uid;
      manifest.libertyApprovedByName = ACTOR.name;
      manifest.libertyApprovedAt = new Date(new Date(createdISO).getTime() + 86_400_000).toISOString();
    }
    if (opts.status === "dispatched") {
      manifest.sealConfirmedBy = ACTOR.uid;
      manifest.sealConfirmedByName = "SEAL Admin (Minnesota)";
      manifest.sealConfirmedAt = new Date(new Date(createdISO).getTime() + 2 * 86_400_000).toISOString();
    }
    await db.collection("manifests").doc(opts.id).set(manifest, { merge: true });
    return manifest;
  }

  const mf1 = await writeManifest({
    id: "demo-mf-01",
    seq: 1,
    status: "dispatched",
    ships: shipmentsForDispatchedManifest.map((x) => x.ship),
    dispatched: true,
    ageDays: 33,
  });
  const mf2 = await writeManifest({
    id: "demo-mf-02",
    seq: 2,
    status: "approved",
    ships: shipmentsForOpenManifest.map((x) => x.ship),
    dispatched: false,
    ageDays: 5,
  });

  // Link manifestId back onto the member shipments (merge update).
  for (const { ship } of shipmentsForDispatchedManifest) {
    await db.collection("shipments").doc(ship.id).set({ manifestId: mf1.id }, { merge: true });
  }
  for (const { ship } of shipmentsForOpenManifest) {
    await db.collection("shipments").doc(ship.id).set({ manifestId: mf2.id }, { merge: true });
  }
  console.log(`   • ${mf1.manifestNumber} — DISPATCHED (${mf1.totalPackages} pkgs, ${mf1.totalWeightLb} lb)`);
  console.log(`   • ${mf2.manifestNumber} — APPROVED  (${mf2.totalPackages} pkgs, ${mf2.totalWeightLb} lb)`);

  // 5. Complaints -----------------------------------------------------------
  console.log("\n🎫 Complaints");
  const issueShipments = createdShipments.filter((s) => s.status === "issue_reported");
  const deliveredShipments = createdShipments.filter((s) => s.status === "delivered");

  interface DemoComplaintDef {
    ship?: Shipment;
    type: ComplaintType;
    status: ComplaintStatus;
    priority: "low" | "medium" | "high";
    description: string;
    resolutionNotes?: string;
    closed?: boolean;
    ageDays: number;
  }

  const complaintDefs: DemoComplaintDef[] = [
    {
      ship: issueShipments[0],
      type: "damaged_package",
      status: "in_review",
      priority: "high",
      description: "Customer reports the outer box was crushed and one sample item is cracked.",
      ageDays: 6,
    },
    {
      ship: issueShipments[1],
      type: "delayed_shipment",
      status: "open",
      priority: "medium",
      description: "Fabric shipment to Nigeria is past its expected delivery window with no update.",
      ageDays: 4,
    },
    {
      ship: deliveredShipments[0],
      type: "wrong_item",
      status: "resolved",
      priority: "low",
      description: "Receiver says one of the listed accessories was missing on delivery.",
      resolutionNotes: "Item located at hub and re-shipped; customer confirmed receipt.",
      closed: true,
      ageDays: 12,
    },
    {
      ship: deliveredShipments[1],
      type: "payment_dispute",
      status: "awaiting_customer",
      priority: "medium",
      description: "Customer queried the service fee line on their invoice; awaiting their reply.",
      ageDays: 9,
    },
  ];

  let ticketCount = 0;
  for (let i = 0; i < complaintDefs.length; i++) {
    const def = complaintDefs[i];
    const id = `demo-tkt-${pad2(i + 1)}`;
    const createdISO = daysAgo(def.ageDays);
    const ship = def.ship;
    const cust = ship ? customerDocs.find((c) => c.id === ship.customerId) : undefined;
    const complaint: Complaint = {
      id,
      ticketNumber: formatTicketNumber(i + 1),
      customerId: ship?.customerId,
      customerName: ship?.customerName ?? cust?.data.fullName,
      shipmentId: ship?.id,
      trackingNumber: ship?.trackingNumber,
      type: def.type,
      description: def.description,
      attachmentUrls: def.type === "damaged_package" ? [PHOTO_URL] : [],
      assignedTo: ACTOR.uid,
      assignedToName: ACTOR.name,
      status: def.status,
      resolutionNotes: def.resolutionNotes,
      priority: def.priority,
      createdAt: createdISO,
      createdBy: "seed-demo",
    };
    if (def.closed) {
      complaint.closedAt = new Date(new Date(createdISO).getTime() + 3 * 86_400_000).toISOString();
    }
    await db.collection("complaints").doc(id).set(complaint, { merge: true });
    ticketCount += 1;
  }
  console.log(`   • ${ticketCount} complaints written`);

  // 6. Refresh customer counters --------------------------------------------
  console.log("\n🔄 Refreshing customer counters");
  for (const c of customerDocs) {
    const shipmentCount = custShipmentCount.get(c.id) ?? 0;
    const totalSpend = Math.round((custSpend.get(c.id) ?? 0) * 100) / 100;
    await db.collection("customers").doc(c.id).set(
      { shipmentCount, totalSpend, updatedAt: nowISO(), updatedBy: "seed-demo" },
      { merge: true },
    );
  }

  // 7. Summary --------------------------------------------------------------
  const totalSpendAll = [...custSpend.values()].reduce((s, v) => s + v, 0);
  console.log("\n✅ Demo data generated!\n");
  console.log("────────────────────────────────────────────");
  console.log("  Created (idempotent — fixed demo-* ids):");
  console.log(`    Customers : ${customerDocs.length}`);
  console.log(`    Shipments : ${createdShipments.length}`);
  console.log(`    Invoices  : ${invoiceCount}`);
  console.log(`    Payments  : ${paymentCount}`);
  console.log(`    Manifests : 2`);
  console.log(`    Complaints: ${ticketCount}`);
  console.log("  Shipment status spread:");
  for (const s of [...statusCounts.keys()].sort((a, b) => rank(a) - rank(b))) {
    console.log(`    ${s.padEnd(18)} ${statusCounts.get(s)}`);
  }
  console.log(`  Total customer spend recorded: $${(Math.round(totalSpendAll * 100) / 100).toFixed(2)}`);
  console.log("────────────────────────────────────────────");
  console.log("  Re-run `npm run seed:demo` any time to refresh.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Demo seed failed:", err);
  process.exit(1);
});

// Touch imports that may otherwise be tree-shaken in some tsx configs.
void FieldValue;
