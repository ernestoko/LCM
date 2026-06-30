/**
 * Liberty & Liberty Logistics — Base Seed Script
 * ============================================================================
 * Bootstraps a Firebase project with the minimum data needed to run the
 * platform. Safe to re-run: every document is written to a fixed id with
 * `{ merge: true }`, so seeding is idempotent — it updates in place and never
 * creates duplicates.
 *
 * What it writes
 *   1. Super Admin auth account + custom claims (plus optional demo staff)
 *   2. Platform settings — currency, commission rules, service fee, payout
 *      accounts and dispatch guards
 *   3. The 6-month pilot tracker
 *   4. Country routes — USA <-> country lanes (Ghana active, the rest draft)
 *   5. Approved rate cards — item-based, per-route weight, per-route sea
 *      (CBM + drum/box units) and the service fee
 *   6. Sequence counters (customer, invoice, manifest, payment, ticket)
 *
 * Usage
 *   npm run seed                 # seed the configured Firebase project
 *   SEED_DEMO=true npm run seed   # also create demo staff accounts
 *
 * Target selection
 *   Connects to the Firebase Emulator Suite automatically when
 *   FIRESTORE_EMULATOR_HOST is set (no credentials needed); otherwise uses the
 *   FIREBASE_ADMIN_* service account.
 *
 * Environment (.env.local or the real environment)
 *   FIREBASE_ADMIN_PROJECT_ID / _CLIENT_EMAIL / _PRIVATE_KEY   production creds
 *   FIRESTORE_EMULATOR_HOST  (+ optional GCLOUD_PROJECT)        emulator mode
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD                      admin overrides
 *   SEED_DEMO=true                                              create demo staff
 *
 * For rich sample data (customers, shipments, invoices, payments, manifests,
 * complaints) run the demo seeder instead:  npm run seed:demo
 * ============================================================================
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { SEED_ITEM_RATES, SEED_ROUTES, SEED_SERVICE_FEE, SEED_SEA_RATE } from "../src/constants/seed-data";
import { SEA_UNIT_DEFS } from "../src/constants/seaUnits";
import { defaultCommissionRules } from "../src/lib/pricing/commission";

/**
 * Minimal `.env.local` loader (avoids a dotenv dependency). Reads simple
 * `KEY=value` lines and sets any that aren't already defined in `process.env`.
 * Missing file is non-fatal — values may come from the real environment.
 */
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

/** Current timestamp as an ISO-8601 string — the platform's canonical date format. */
const nowISO = () => new Date().toISOString();

/**
 * Initialise the Firebase Admin SDK exactly once.
 * - Emulator: when FIRESTORE_EMULATOR_HOST is set, connect with a project id
 *   only — no service-account credentials are required.
 * - Production: use the FIREBASE_ADMIN_* service account; exits with a clear
 *   message if any of the three values are missing.
 */
function initAdmin() {
  // Emulator mode: no real credentials needed (FIRESTORE_EMULATOR_HOST set).
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const projectId =
      process.env.GCLOUD_PROJECT || process.env.FIREBASE_ADMIN_PROJECT_ID || "demo-lcm";
    if (!getApps().length) initializeApp({ projectId });
    try {
      getFirestore().settings({ ignoreUndefinedProperties: true });
    } catch {
      /* settings() can only be called once */
    }
    console.log(`🧪 Targeting Firebase emulators (project ${projectId}).`);
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

/**
 * Create or update a Firebase Auth user, set its custom claims (role + org, and
 * an optional customerId for portal users), and mirror the profile into the
 * `users` collection. Idempotent — re-running updates the existing account
 * (including its password) rather than failing. Returns the user's uid.
 */
async function ensureUser(opts: {
  email: string;
  password: string;
  displayName: string;
  role: string;
  org: string;
  customerId?: string;
}) {
  const auth = getAuth();
  const db = getFirestore();
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(opts.email);
    uid = existing.uid;
    await auth.updateUser(uid, { password: opts.password, displayName: opts.displayName });
    console.log(`   ↺ Updated existing user ${opts.email}`);
  } catch {
    const created = await auth.createUser({
      email: opts.email,
      password: opts.password,
      displayName: opts.displayName,
    });
    uid = created.uid;
    console.log(`   ＋ Created user ${opts.email}`);
  }
  await auth.setCustomUserClaims(uid, {
    role: opts.role,
    org: opts.org,
    ...(opts.customerId ? { customerId: opts.customerId } : {}),
  });
  await db.collection("users").doc(uid).set(
    {
      email: opts.email,
      displayName: opts.displayName,
      role: opts.role,
      organization: opts.org,
      customerId: opts.customerId ?? null,
      active: true,
      createdAt: nowISO(),
      createdBy: "seed",
    },
    { merge: true },
  );
  return uid;
}

/** Run every seed phase in order, then print the admin login and exit. */
async function main() {
  initAdmin();
  const db = getFirestore();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@libertycargomovers.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Liberty@2026!";

  console.log("\n🚢 Seeding Liberty & Liberty Logistics platform…\n");

  // 1. Super Admin -----------------------------------------------------------
  console.log("👤 Users");
  const adminUid = await ensureUser({
    email: adminEmail,
    password: adminPassword,
    displayName: "Liberty Super Admin",
    role: "liberty_super_admin",
    org: "liberty",
  });
  const actor = { uid: adminUid, name: "Liberty Super Admin" };

  if (process.env.SEED_DEMO === "true") {
    await ensureUser({ email: "ops@libertycargomovers.com", password: adminPassword, displayName: "Liberty Operations", role: "liberty_admin", org: "liberty" });
    await ensureUser({ email: "finance@libertycargomovers.com", password: adminPassword, displayName: "Finance User", role: "finance_user", org: "liberty" });
    await ensureUser({ email: "operations@libertylogistics.com", password: adminPassword, displayName: "Operations Manager", role: "seal_admin", org: "seal" });
    await ensureUser({ email: "warehouse@libertylogistics.com", password: adminPassword, displayName: "Warehouse Staff", role: "seal_staff", org: "seal" });
  }

  // 2. Platform settings -----------------------------------------------------
  console.log("⚙️  Settings");
  await db.collection("settings").doc("platform").set(
    {
      id: "platform",
      companyName: "Liberty Cargo Movers",
      defaultCurrency: "USD",
      defaultCommissionPercent: 10,
      defaultPlatformFeePerShipment: 0,
      monthlySupportFee: 0,
      commissionRules: defaultCommissionRules(),
      serviceFeeByRoute: { "USA-NIGERIA": false },
      serviceFeeAmount: SEED_SERVICE_FEE.amount,
      paymentInstructions:
        "Pay via Mobile Money or Bank transfer. Use your tracking number as the payment reference. Contact support for assistance.",
      payoutAccounts: [
        {
          id: "momo-gh",
          type: "mobile_money",
          label: "MTN Mobile Money (Ghana)",
          accountName: "Liberty Cargo Movers",
          accountNumber: "024 000 0000",
          bankOrProvider: "MTN MoMo",
          enabled: true,
        },
        {
          id: "zelle-us",
          type: "zelle",
          label: "Zelle (USA)",
          accountName: "Liberty Cargo Movers",
          accountNumber: "pay@libertycargomovers.com",
          enabled: true,
        },
      ],
      dispatchGuards: {
        requirePhoto: true,
        requireWeight: true,
        requireInvoice: true,
        requirePaymentConfirmed: true,
        requireManifest: true,
      },
      createdAt: nowISO(),
      createdBy: "seed",
    },
    { merge: true },
  );

  // 3. Pilot tracker ---------------------------------------------------------
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 6);
  await db.collection("pilotTracker").doc("pilot").set(
    {
      id: "pilot",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      activeRoutes: ["USA-GHANA"],
      countriesOnboarded: ["Ghana"],
      recommendation: "undecided",
      createdAt: nowISO(),
      createdBy: "seed",
    },
    { merge: true },
  );

  // 4. Country routes --------------------------------------------------------
  console.log("🌍 Country routes");
  for (const r of SEED_ROUTES) {
    const direction = r.direction ?? "usa_to_country";
    await db.collection("countryRoutes").doc(r.code).set(
      {
        id: r.code,
        code: r.code,
        countryName: r.countryName,
        countryCode: r.countryCode,
        direction,
        origin: r.origin ?? null,
        destination: r.destination ?? null,
        pricingType: r.pricingType,
        defaultRate: r.pricePerLb ?? null,
        currency: "USD",
        transitTimeDays: r.transitTimeDays,
        prohibitedItems: ["Cash", "Weapons", "Hazardous materials", "Perishables"],
        requiredDocuments: ["Valid ID", "Invoice / receipt for high-value items"],
        customsProcess: "Standard customs clearing at the destination hub on arrival.",
        deliveryCoverage: r.destination ?? r.countryName,
        sealConfirmed: r.startActive,
        libertyApproved: r.startActive,
        libertyApprovedBy: r.startActive ? actor.uid : null,
        libertyApprovedAt: r.startActive ? nowISO() : null,
        status: r.startActive ? "active" : "draft",
        serviceFeeApplies: r.serviceFeeApplies,
        createdAt: nowISO(),
        createdBy: "seed",
      },
      { merge: true },
    );
    console.log(`   • ${r.countryName} (${r.code}, ${direction}) — ${r.startActive ? "ACTIVE" : "draft"}`);
  }

  // 5. Rate cards ------------------------------------------------------------
  console.log("🏷️  Rate cards (approved)");
  const baseCard = {
    currency: "USD",
    effectiveDate: nowISO(),
    status: "active",
    version: 1,
    uploadedBy: actor.uid,
    uploadedByName: "LCM Operations",
    approvedBy: actor.uid,
    approvedByName: actor.name,
    approvalDate: nowISO(),
    createdAt: nowISO(),
    createdBy: "seed",
    changeLog: [{ at: nowISO(), by: actor.uid, byName: actor.name, action: "seeded_active" }],
  };

  // Item-based card
  await db.collection("rateCards").doc("seed-item-based").set(
    {
      id: "seed-item-based",
      name: "Standard Item-Based Pricing",
      pricingType: "item_based",
      items: SEED_ITEM_RATES,
      ...baseCard,
    },
    { merge: true },
  );
  console.log(`   • Item-based card — ${SEED_ITEM_RATES.length} items`);

  // Weight-based card per active/draft route
  for (const r of SEED_ROUTES) {
    if (r.pricingType !== "weight_based") continue;
    const direction = r.direction ?? "usa_to_country";
    // The card's `country` must equal the shipment's destinationCountry so the
    // pricing engine's country filter matches for BOTH directions. The per-lb
    // label uses the non-USA endpoint for readability; pricePerLb is the rate
    // the engine ultimately falls back to.
    const cardCountry =
      r.destination ?? (direction === "country_to_usa" ? "United States" : r.countryName);
    await db.collection("rateCards").doc(`seed-weight-${r.code}`).set(
      {
        id: `seed-weight-${r.code}`,
        name: `Weight Pricing — ${r.countryName} (${direction})`,
        pricingType: "weight_based",
        route: r.code,
        country: cardCountry,
        pricePerLb: r.pricePerLb,
        items: [{ key: r.countryCode, label: cardCountry, condition: "any", unitPrice: r.pricePerLb ?? 0, perUnit: "lb" }],
        ...baseCard,
      },
      { merge: true },
    );
    console.log(`   • Weight card — ${r.countryName} (${direction}) @ $${r.pricePerLb}/lb`);
  }

  // Sea-freight card per route (CBM rate + minimum CBM + standard unit prices).
  // PLACEHOLDER rates — edited on the active sea rate card as rates change.
  for (const r of SEED_ROUTES) {
    const direction = r.direction ?? "usa_to_country";
    const cardCountry =
      r.destination ?? (direction === "country_to_usa" ? "United States" : r.countryName);
    await db.collection("rateCards").doc(`seed-sea-${r.code}`).set(
      {
        id: `seed-sea-${r.code}`,
        name: `Sea Pricing — ${r.countryName} (${direction})`,
        pricingType: "sea_freight",
        route: r.code,
        country: cardCountry,
        pricePerCbm: SEED_SEA_RATE.pricePerCbm,
        minimumCbm: SEED_SEA_RATE.minimumCbm,
        items: SEA_UNIT_DEFS.map((d) => ({
          key: d.key,
          label: d.label,
          condition: "any",
          unitPrice: d.defaultPrice,
          perUnit: "unit",
        })),
        ...baseCard,
      },
      { merge: true },
    );
    console.log(`   • Sea card — ${r.countryName} (${direction}) @ $${SEED_SEA_RATE.pricePerCbm}/CBM`);
  }

  // Service-fee card
  await db.collection("rateCards").doc("seed-service-fee").set(
    {
      id: "seed-service-fee",
      name: "Service Fee",
      pricingType: "service_fee",
      items: [],
      serviceFee: {
        amount: SEED_SERVICE_FEE.amount,
        waivedForCountries: SEED_SERVICE_FEE.waivedForCountries,
        enabled: SEED_SERVICE_FEE.enabled,
      },
      ...baseCard,
    },
    { merge: true },
  );
  console.log(`   • Service-fee card — $${SEED_SERVICE_FEE.amount} (waived: ${SEED_SERVICE_FEE.waivedForCountries.join(", ")})`);

  // 6. Counters --------------------------------------------------------------
  for (const c of ["customer", "invoice", "manifest", "payment", "ticket"]) {
    await db.collection("counters").doc(c).set({ value: 0, updatedAt: nowISO() }, { merge: true });
  }

  console.log("\n✅ Seed complete!\n");
  console.log("────────────────────────────────────────────");
  console.log("  Super Admin login:");
  console.log(`    Email:    ${adminEmail}`);
  console.log(`    Password: ${adminPassword}`);
  console.log("────────────────────────────────────────────");
  if (process.env.SEED_DEMO === "true") {
    console.log("  Demo staff (same password):");
    console.log("    ops@libertycargomovers.com (Liberty Admin)");
    console.log("    finance@libertycargomovers.com (Finance)");
    console.log("    operations@libertylogistics.com (Operations Manager)");
    console.log("    warehouse@libertylogistics.com (Warehouse Staff)");
    console.log("────────────────────────────────────────────");
  }
  console.log("  ⚠️  Change these passwords after first login.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
