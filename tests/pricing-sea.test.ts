import { describe, it, expect } from "vitest";
import { calculatePricing, type PricingContext } from "@/lib/pricing/engine";
import { defaultPlatformSettings } from "@/lib/db/repositories/settings";
import type { RateCard, CountryRoute, PlatformSettings, SeaCargo } from "@/types";

const PAST = "2020-01-01T00:00:00.000Z";

function seaCard(overrides: Partial<RateCard> = {}): RateCard {
  return {
    id: "rc-sea",
    name: "USA-Ghana Sea",
    pricingType: "sea_freight",
    route: "USA-GHANA",
    currency: "USD",
    items: [
      { key: "drum_200l", label: "200L Drum", unitPrice: 150, perUnit: "unit" },
      { key: "box_large", label: "Large Box", unitPrice: 85, perUnit: "unit" },
    ],
    pricePerCbm: 220,
    minimumCbm: 1,
    effectiveDate: PAST,
    status: "active",
    version: 1,
    uploadedBy: "u1",
    changeLog: [],
    createdAt: PAST,
    createdBy: "u1",
    ...overrides,
  } as RateCard;
}

function seaRoute(overrides: Partial<CountryRoute> = {}): CountryRoute {
  return {
    id: "r-ghana-sea",
    code: "USA-GHANA",
    countryName: "Ghana",
    countryCode: "GH",
    direction: "usa_to_country",
    pricingType: "sea_freight",
    cargoType: "sea",
    currency: "USD",
    prohibitedItems: [],
    requiredDocuments: [],
    sealConfirmed: true,
    libertyApproved: true,
    status: "active",
    serviceFeeApplies: true,
    createdAt: PAST,
    createdBy: "u1",
    ...overrides,
  } as CountryRoute;
}

const settings: PlatformSettings = defaultPlatformSettings();
function ctx(overrides: Partial<PricingContext> = {}): PricingContext {
  return { settings, ...overrides };
}

function seaShipment(seaCargo: SeaCargo) {
  return {
    cargoType: "sea" as const,
    pricingMode: "weight_based" as const, // ignored for sea
    items: [],
    seaCargo,
    routeCode: "USA-GHANA",
    destinationCountry: "Ghana",
    customerId: "c1",
  };
}

describe("calculatePricing — sea (CBM)", () => {
  it("charges CBM × per-CBM rate and adds the Ghana service fee", () => {
    const result = calculatePricing(
      seaShipment({
        volumetric: [{ id: "a", lengthCm: 100, widthCm: 100, heightCm: 100, quantity: 2 }], // 2 CBM
        units: [],
      }),
      ctx({ seaRateCard: seaCard(), route: seaRoute() }),
    );
    expect(result.subtotal).toBe(440); // 2 × 220
    expect(result.serviceFee).toBe(30);
    expect(result.total).toBe(470);
    const cbmLine = result.lines.find((l) => l.type === "cbm");
    expect(cbmLine?.quantity).toBe(2);
    expect(result.warnings).toEqual([]);
  });

  it("applies the minimum billable CBM when cargo is below it", () => {
    const result = calculatePricing(
      seaShipment({
        volumetric: [{ id: "a", lengthCm: 50, widthCm: 40, heightCm: 30, quantity: 1 }], // 0.06 CBM
        units: [],
      }),
      ctx({ seaRateCard: seaCard(), route: seaRoute() }),
    );
    // billed at min 1 CBM × 220
    expect(result.subtotal).toBe(220);
    const cbmLine = result.lines.find((l) => l.type === "cbm");
    expect(cbmLine?.quantity).toBe(1);
    expect(cbmLine?.description).toContain("min 1 CBM");
  });
});

describe("calculatePricing — sea (units)", () => {
  it("charges flat per-unit rates for boxes and drums", () => {
    const result = calculatePricing(
      seaShipment({
        volumetric: [],
        units: [
          { id: "u1", unitKey: "drum_200l", label: "200L Drum", quantity: 2 },
          { id: "u2", unitKey: "box_large", label: "Large Box", quantity: 1 },
        ],
      }),
      ctx({ seaRateCard: seaCard(), route: seaRoute() }),
    );
    expect(result.subtotal).toBe(385); // 150×2 + 85×1
    expect(result.lines.filter((l) => l.type === "unit")).toHaveLength(2);
    expect(result.lines.some((l) => l.type === "cbm")).toBe(false);
  });

  it("warns when a unit has no approved price", () => {
    const result = calculatePricing(
      seaShipment({
        volumetric: [],
        units: [{ id: "u1", unitKey: "unknown_drum", label: "Mystery Drum", quantity: 1 }],
      }),
      ctx({ seaRateCard: seaCard(), route: seaRoute() }),
    );
    expect(result.subtotal).toBe(0);
    expect(result.warnings.some((w) => w.includes("Mystery Drum"))).toBe(true);
  });
});

describe("calculatePricing — sea (mixed)", () => {
  it("bills CBM cargo AND standard units on one invoice", () => {
    const result = calculatePricing(
      seaShipment({
        volumetric: [{ id: "a", lengthCm: 100, widthCm: 100, heightCm: 100, quantity: 1 }], // 1 CBM → 220
        units: [{ id: "u1", unitKey: "drum_200l", label: "200L Drum", quantity: 1 }], // 150
      }),
      ctx({ seaRateCard: seaCard(), route: seaRoute() }),
    );
    expect(result.subtotal).toBe(370); // 220 + 150
    expect(result.serviceFee).toBe(30);
    expect(result.total).toBe(400);
    expect(result.lines.some((l) => l.type === "cbm")).toBe(true);
    expect(result.lines.some((l) => l.type === "unit")).toBe(true);
  });
});

describe("calculatePricing — sea (edge cases)", () => {
  it("warns when no sea rate card is available", () => {
    const result = calculatePricing(
      seaShipment({
        volumetric: [{ id: "a", lengthCm: 100, widthCm: 100, heightCm: 100, quantity: 1 }],
        units: [],
      }),
      ctx({ seaRateCard: null, route: seaRoute() }),
    );
    expect(result.warnings.some((w) => w.includes("No active sea-freight rate card"))).toBe(true);
  });

  it("falls back to the route's defaultRatePerCbm when the card lacks a rate", () => {
    const result = calculatePricing(
      seaShipment({
        volumetric: [{ id: "a", lengthCm: 100, widthCm: 100, heightCm: 100, quantity: 1 }],
        units: [],
      }),
      ctx({
        seaRateCard: seaCard({ pricePerCbm: undefined, minimumCbm: 0 }),
        route: seaRoute({ defaultRatePerCbm: 200 }),
      }),
    );
    expect(result.subtotal).toBe(200);
  });

  it("warns when no sea cargo has been entered", () => {
    const result = calculatePricing(
      seaShipment({ volumetric: [], units: [] }),
      ctx({ seaRateCard: seaCard(), route: seaRoute() }),
    );
    expect(result.subtotal).toBe(0);
    expect(result.warnings.some((w) => w.includes("No sea cargo entered"))).toBe(true);
  });
});
