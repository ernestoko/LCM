/**
 * Liberty Cargo Movers — Seed Script
 * ----------------------------------------------------------------------------
 * Bootstraps a fresh Firebase project with:
 *   • A Liberty Super Admin account (+ custom claims)
 *   • Optional demo staff & a demo customer
 *   • Platform settings + commission rules + service-fee config
 *   • SEAL's approved rate cards (item-based + per-route weight + service fee)
 *   • Country routes (Ghana active; others draft awaiting Liberty approval)
 *   • The 6-month pilot tracker
 *
 * Run:  npm run seed
 * Requires FIREBASE_ADMIN_* env vars in .env.local. Optional:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_DEMO=true
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import { SEED_ITEM_RATES, SEED_ROUTES, SEED_SERVICE_FEE } from "../src/constants/seed-data";
import { defaultCommissionRules } from "../src/lib/pricing/commission";

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

function initAdmin() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Missing FIREBASE_ADMIN_* env vars. Fill them in .env.local first.");
    process.exit(1);
  }
  if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

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

async function main() {
  initAdmin();
  const db = getFirestore();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@libertycargomovers.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Liberty@2026!";

  console.log("\n🚢 Seeding Liberty Cargo Movers platform…\n");

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
    await ensureUser({ email: "seal@seallogistics.com", password: adminPassword, displayName: "SEAL Admin (Minnesota)", role: "seal_admin", org: "seal" });
    await ensureUser({ email: "warehouse@seallogistics.com", password: adminPassword, displayName: "SEAL Staff", role: "seal_staff", org: "seal" });
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
    await db.collection("countryRoutes").doc(r.code).set(
      {
        id: r.code,
        code: r.code,
        countryName: r.countryName,
        countryCode: r.countryCode,
        direction: "usa_to_country",
        pricingType: r.pricingType,
        defaultRate: r.pricePerLb ?? null,
        currency: "USD",
        transitTimeDays: r.transitTimeDays,
        prohibitedItems: ["Cash", "Weapons", "Hazardous materials", "Perishables"],
        requiredDocuments: ["Valid ID", "Invoice / receipt for high-value items"],
        customsProcess: "Standard SEAL customs clearing on arrival in Ghana hub.",
        deliveryCoverage: r.countryName,
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
    console.log(`   • ${r.countryName} (${r.code}) — ${r.startActive ? "ACTIVE" : "draft"}`);
  }

  // 5. Rate cards ------------------------------------------------------------
  console.log("🏷️  Rate cards (SEAL approved)");
  const baseCard = {
    currency: "USD",
    effectiveDate: nowISO(),
    status: "active",
    version: 1,
    uploadedBy: actor.uid,
    uploadedByName: "SEAL Logistics",
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
      name: "SEAL Item-Based Pricing (Pilot)",
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
    await db.collection("rateCards").doc(`seed-weight-${r.code}`).set(
      {
        id: `seed-weight-${r.code}`,
        name: `SEAL Weight Pricing — ${r.countryName}`,
        pricingType: "weight_based",
        route: r.code,
        country: r.countryName,
        pricePerLb: r.pricePerLb,
        items: [{ key: r.countryCode, label: r.countryName, condition: "any", unitPrice: r.pricePerLb ?? 0, perUnit: "lb" }],
        ...baseCard,
      },
      { merge: true },
    );
    console.log(`   • Weight card — ${r.countryName} @ $${r.pricePerLb}/lb`);
  }

  // Service-fee card
  await db.collection("rateCards").doc("seed-service-fee").set(
    {
      id: "seed-service-fee",
      name: "SEAL Service Fee (Pilot)",
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
    console.log("    seal@seallogistics.com (SEAL Admin)");
    console.log("    warehouse@seallogistics.com (SEAL Staff)");
    console.log("────────────────────────────────────────────");
  }
  console.log("  ⚠️  Change these passwords after first login.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

// Touch imports that may otherwise be tree-shaken in some tsx configs.
void FieldValue;
