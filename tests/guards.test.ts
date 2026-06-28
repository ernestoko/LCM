import { describe, it, expect } from "vitest";
import { checkDispatchReadiness, canMoveToStatus } from "@/lib/shipments/guards";
import { defaultPlatformSettings } from "@/lib/db/repositories/settings";
import type { Shipment, PlatformSettings } from "@/types";

const settings: PlatformSettings = defaultPlatformSettings();

const NOW = "2026-06-28T00:00:00.000Z";

/** A shipment that satisfies every dispatch guard. */
function readyShipment(overrides: Partial<Shipment> = {}): Shipment {
  return {
    id: "s1",
    trackingNumber: "LCM-2606-ABC123",
    customerId: "c1",
    customerName: "Ama Mensah",
    sender: { name: "Sender" },
    receiver: { name: "Receiver" },
    originCountry: "United States",
    destinationCountry: "Ghana",
    routeCode: "USA-GHANA",
    pricingMode: "weight_based",
    items: [],
    weightLb: 12,
    photoUrls: ["https://example.com/p.jpg"],
    documentUrls: [],
    paymentStatus: "confirmed",
    status: "added_to_manifest",
    sealHandlingStatus: "intake_complete",
    libertyHandlingStatus: "invoiced",
    invoiceId: "inv1",
    manifestId: "mf1",
    statusHistory: [],
    locked: false,
    createdAt: NOW,
    createdBy: "u1",
    ...overrides,
  } as Shipment;
}

describe("checkDispatchReadiness", () => {
  it("returns ok with no blockers when every requirement is satisfied", () => {
    const check = checkDispatchReadiness(readyShipment(), settings);
    expect(check.ok).toBe(true);
    expect(check.blockers).toEqual([]);
  });

  it("blocks when the package photo is missing", () => {
    const check = checkDispatchReadiness(readyShipment({ photoUrls: [] }), settings);
    expect(check.ok).toBe(false);
    expect(check.blockers.some((b) => b.includes("photo"))).toBe(true);
  });

  it("blocks when the weight has not been entered", () => {
    const check = checkDispatchReadiness(readyShipment({ weightLb: undefined }), settings);
    expect(check.blockers.some((b) => b.includes("weight"))).toBe(true);
  });

  it("blocks when no invoice has been generated", () => {
    const check = checkDispatchReadiness(readyShipment({ invoiceId: undefined }), settings);
    expect(check.blockers.some((b) => b.includes("invoice"))).toBe(true);
  });

  it("blocks when the package is not on a manifest", () => {
    const check = checkDispatchReadiness(readyShipment({ manifestId: undefined }), settings);
    expect(check.blockers.some((b) => b.includes("manifest"))).toBe(true);
  });

  it("blocks when payment is not confirmed", () => {
    const check = checkDispatchReadiness(readyShipment({ paymentStatus: "unpaid" }), settings);
    expect(check.blockers.some((b) => b.includes("Payment is not confirmed"))).toBe(true);
  });

  it("clears the payment blocker when a dispatchOverride is present", () => {
    const check = checkDispatchReadiness(
      readyShipment({
        paymentStatus: "unpaid",
        dispatchOverride: { by: "admin", at: NOW, reason: "VIP customer, paying on delivery" },
      }),
      settings,
    );
    expect(check.ok).toBe(true);
    expect(check.blockers).toEqual([]);
  });

  it("accumulates one blocker per missing requirement", () => {
    const check = checkDispatchReadiness(
      readyShipment({
        photoUrls: [],
        weightLb: undefined,
        invoiceId: undefined,
        manifestId: undefined,
        paymentStatus: "unpaid",
      }),
      settings,
    );
    // photo, weight, invoice, payment, manifest = 5
    expect(check.blockers).toHaveLength(5);
  });
});

describe("canMoveToStatus", () => {
  it("blocks any transition on a locked shipment", () => {
    const res = canMoveToStatus(readyShipment({ locked: true }), "in_transit", settings);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("locked");
  });

  it("blocks moving to ready_for_dispatch when dispatch guards fail", () => {
    const res = canMoveToStatus(readyShipment({ paymentStatus: "unpaid" }), "ready_for_dispatch", settings);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("Payment is not confirmed");
  });

  it("blocks moving to dispatched when dispatch guards fail", () => {
    const res = canMoveToStatus(readyShipment({ invoiceId: undefined }), "dispatched", settings);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("invoice");
  });

  it("allows moving to ready_for_dispatch when all guards pass", () => {
    const res = canMoveToStatus(readyShipment(), "ready_for_dispatch", settings);
    expect(res.ok).toBe(true);
  });

  it("does not run dispatch guards for a non-dispatch transition", () => {
    // Failing guards, but moving to a status that isn't a dispatch point.
    const res = canMoveToStatus(readyShipment({ paymentStatus: "unpaid" }), "inspected", settings);
    expect(res.ok).toBe(true);
  });
});
