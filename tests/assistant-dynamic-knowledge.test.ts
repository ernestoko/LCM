import { describe, it, expect } from "vitest";
import { buildDynamicKnowledge } from "@/lib/assistant/dynamicKnowledge";
import { searchKnowledge } from "@/lib/assistant/brain";
import { WAREHOUSES } from "@/constants/warehouses";
import { SEA_UNIT_DEFS } from "@/constants/seaUnits";
import { BUSINESS } from "@/constants/business";

/**
 * These tests prove the knowledge base is genuinely SELF-UPDATING from the
 * platform's own data (no AI, no hand-editing): the generated answers reflect
 * the current warehouses, sea-unit catalogue and contact details, so changing
 * that data changes Jesselyn's answers automatically.
 */
describe("self-updating (data-derived) knowledge", () => {
  const entries = buildDynamicKnowledge();

  it("produces a stable set of dynamic entries", () => {
    expect(entries.length).toBeGreaterThanOrEqual(5);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it("hub answer reflects EVERY warehouse city currently configured", () => {
    const hubs = entries.find((e) => e.id === "dyn-hubs")!;
    for (const w of WAREHOUSES) {
      expect(hubs.a).toContain(w.city);
    }
  });

  it("sea-unit answer reflects EVERY unit in the live catalogue", () => {
    const units = entries.find((e) => e.id === "dyn-sea-units")!;
    for (const u of SEA_UNIT_DEFS) {
      expect(units.a).toContain(u.label);
    }
  });

  it("contact answer reflects the current business phone + email", () => {
    const contact = entries.find((e) => e.id === "dyn-contact")!;
    expect(contact.a).toContain(BUSINESS.phone);
    expect(contact.a).toContain(BUSINESS.email);
  });

  it("the dynamic facts are reachable through the matcher", () => {
    const hubs = searchKnowledge("which cities are your warehouses in");
    expect(hubs).not.toBeNull();
    expect(hubs!.a).toContain(WAREHOUSES[0].city);

    const journey = searchKnowledge("what stages does a sea shipment go through");
    expect(journey).not.toBeNull();
    expect(journey!.topic).toBe("Tracking");
  });
});

describe("jargon & acronyms are answerable", () => {
  const cases: { q: string; topic: string }[] = [
    { q: "what's the difference between FCL and LCL", topic: "Sea Cargo" },
    { q: "what is a bill of lading", topic: "Jargon" },
    { q: "what does consignee mean", topic: "Jargon" },
    { q: "explain incoterms like FOB and CIF", topic: "Jargon" },
    { q: "what is demurrage", topic: "Jargon" },
    { q: "what do ETA and ETD mean", topic: "Jargon" },
    { q: "what is a freight forwarder", topic: "Jargon" },
    { q: "what does TEU mean", topic: "Jargon" },
  ];
  for (const { q, topic } of cases) {
    it(`"${q}" → ${topic}`, () => {
      const r = searchKnowledge(q);
      expect(r).not.toBeNull();
      expect(r!.topic).toBe(topic);
    });
  }
});
