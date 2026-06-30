import type { KnowledgeEntry } from "@/constants/knowledge";
import { BUSINESS } from "@/constants/business";
import { WAREHOUSES } from "@/constants/warehouses";
import { SEA_UNIT_DEFS } from "@/constants/seaUnits";
import {
  SHIPMENT_STATUS_META,
  SHIPMENT_STATUS_ORDER,
  SEA_SHIPMENT_STATUS_ORDER,
} from "@/constants/statuses";

/**
 * Self-updating knowledge — generated deterministically from the platform's own
 * source-of-truth data, with NO AI involved. Whenever the underlying data
 * changes (a new hub in WAREHOUSES, a new sea unit in SEA_UNIT_DEFS, a changed
 * contact number, a new status in the pipeline), Jesselyn's answers update on
 * the next build automatically — no one has to rewrite the FAQ and no model has
 * to be retrained. This is folded into the matcher's corpus alongside the
 * curated static knowledge (see lib/assistant/brain).
 */

/** Group warehouse hubs by country into a readable "Country: City, City" list. */
function hubsByCountry(): string {
  const byCountry = new Map<string, string[]>();
  for (const w of WAREHOUSES) {
    const list = byCountry.get(w.country) ?? [];
    list.push(w.city);
    byCountry.set(w.country, list);
  }
  return [...byCountry.entries()].map(([country, cities]) => `${country} (${cities.join(", ")})`).join("; ");
}

/** Render the customer-facing stages of a status pipeline as "A → B → C". */
function journey(order: readonly string[]): string {
  const hidden = new Set(["draft", "consolidated", "cancelled", "issue_reported"]);
  return order
    .filter((s) => !hidden.has(s))
    .map((s) => SHIPMENT_STATUS_META[s as keyof typeof SHIPMENT_STATUS_META]?.label ?? s)
    .join(" → ");
}

/** Build the live, data-derived knowledge entries. */
export function buildDynamicKnowledge(): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];

  // Hubs / locations — derived from WAREHOUSES.
  entries.push({
    id: "dyn-hubs",
    topic: "Warehouse",
    q: "Where are your warehouses / hubs located?",
    a: `We run fulfilment hubs in ${hubsByCountry()}. When you open an account you get a personal suite at our hubs so you can shop and ship to us directly, then we forward your parcels onward.`,
    keywords: ["where are you", "location", "locations", "hub", "hubs", "warehouse", "office", "branch", "cities", "which countries hub"],
  });

  // Contact details — derived from BUSINESS.
  entries.push({
    id: "dyn-contact",
    topic: "Contact",
    q: "How do I contact Liberty & Liberty Logistics?",
    a: `You can reach us by phone at ${BUSINESS.phone}, by email at ${BUSINESS.email}, or via the contact options in the chat. Our hubs include ${BUSINESS.addresses.usa} and ${BUSINESS.addresses.ghana}.`,
    keywords: ["contact", "phone number", "email address", "call you", "reach you", "get in touch", "telephone"],
  });

  // Sea units catalogue — derived from SEA_UNIT_DEFS (kept in sync with intake).
  const unitList = SEA_UNIT_DEFS.map((u) => `${u.label} (≈${u.approxCbm} CBM)`).join(", ");
  entries.push({
    id: "dyn-sea-units",
    topic: "Sea Cargo",
    q: "What standard sea units can I ship, and how big are they?",
    a: `For sea cargo you can ship by these standard units (each charged at a flat per-unit rate): ${unitList}. You can also send loose cargo measured by CBM, and mix units and CBM cargo on the same shipment and invoice.`,
    keywords: ["sea units", "drum", "drums", "barrel", "box", "boxes", "unit sizes", "standard units", "200l", "100l", "how big is a drum"],
  });

  // Air shipment journey — derived from the live status pipeline.
  entries.push({
    id: "dyn-air-journey",
    topic: "Tracking",
    q: "What stages does an air shipment go through?",
    a: `Here's the journey for an Air Cargo shipment: ${journey(SHIPMENT_STATUS_ORDER)}. You're notified at each milestone and your tracking timeline shows exactly where your package is.`,
    keywords: ["stages", "journey", "process", "steps", "lifecycle", "milestones", "what happens", "pipeline", "air stages"],
  });

  // Sea shipment journey — derived from the live sea status pipeline.
  entries.push({
    id: "dyn-sea-journey",
    topic: "Tracking",
    q: "What stages does a sea shipment go through?",
    a: `Here's the journey for a Sea Cargo shipment: ${journey(SEA_SHIPMENT_STATUS_ORDER)}. Sea takes longer than air but you're kept updated at every step.`,
    keywords: ["sea stages", "sea journey", "container stages", "vessel stages", "ocean process", "sea milestones"],
  });

  return entries;
}
