import { describe, it, expect } from "vitest";
import {
  calculatePricing,
  selectActiveRateCard,
  serviceFeeApplies,
  type PricingContext,
} from "@/lib/pricing/engine";
import { defaultPlatformSettings } from "@/lib/db/repositories/settings";
import type { RateCard, CountryRoute, PlatformSettings } from "@/types";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const PAST = "2020-01-01T00:00:00.000Z"; // well before now
const FUTURE = "2999-01-01T00:00:00.000Z"; // well after now

function itemCard(overrides: Partial<RateCard> = {}): RateCard {
  return {
    id: "rc-item",
    name: "USA-Ghana Items",
    pricingType: "item_based",
    route: "USA-GHANA",
    currency: "USD",
    items: [
      { key: "iphone_new", label: "New iPhone", unitPrice: 85, perUnit: "item" },
      { key: "ipad_new", label: "New iPad", unitPrice: 85, perUnit: "item" },
    ],
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

function weightCard(overrides: Partial<RateCard> = {}): RateCard {
  return {
    id: "rc-weight",
    name: "USA-Ghana Weight",
    pricingType: "weight_based",
    route: "USA-GHANA",
    currency: "USD",
    items: [],
    pricePerLb: 11.57,
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

function route(overrides: Partial<CountryRoute> = {}): CountryRoute {
  return {
    id: "r-ghana",
    code: "USA-GHANA",
    countryName: "Ghana",
    countryCode: "GH",
    direction: "usa_to_country",
    pricingType: "weight_based",
    defaultRate: 11.57,
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

// ---------------------------------------------------------------------------
// Item-based pricing
// ---------------------------------------------------------------------------

describe("calculatePricing — item-based", () => {
  it("sums unitPrice × quantity across multiple items and adds the Ghana service fee", () => {
    const result = calculatePricing(
      {
        pricingMode: "item_based",
        items: [
          { rateKey: "iphone_new", category: "phone", itemType: "New iPhone", condition: "new", quantity: 2 },
          { rateKey: "ipad_new", category: "tablet", itemType: "New iPad", condition: "new", quantity: 1 },
        ],
        routeCode: "USA-GHANA",
        destinationCountry: "Ghana",
        customerId: "c1",
      },
      ctx({ itemRateCard: itemCard(), route: route() }),
    );

    // 85*2 + 85*1 = 255
    expect(result.subtotal).toBe(255);
    expect(result.serviceFee).toBe(30); // Ghana => fee applies
    expect(result.total).toBe(285); // subtotal + serviceFee
    expect(result.warnings).toEqual([]);
    expect(result.rateCardId).toBe("rc-item");
  });

  it("warns when an item has no approved price and prices it at 0", () => {
    const result = calculatePricing(
      {
        pricingMode: "item_based",
        items: [
          { rateKey: "unknown_key", category: "misc", itemType: "Mystery Gadget", condition: "new", quantity: 3 },
        ],
        routeCode: "USA-GHANA",
        destinationCountry: "Ghana",
        customerId: "c1",
      },
      ctx({ itemRateCard: itemCard(), route: route() }),
    );

    expect(result.subtotal).toBe(0);
    expect(result.warnings.some((w) => w.includes("Mystery Gadget"))).toBe(true);
  });

  it("warns when no item-based rate card is available", () => {
    const result = calculatePricing(
      {
        pricingMode: "item_based",
        items: [
          { rateKey: "iphone_new", category: "phone", itemType: "New iPhone", condition: "new", quantity: 1 },
        ],
        routeCode: "USA-GHANA",
        destinationCountry: "Ghana",
        customerId: "c1",
      },
      ctx({ itemRateCard: null, route: route() }),
    );

    expect(result.warnings.some((w) => w.includes("No active item-based rate card"))).toBe(true);
    expect(result.rateCardName).toBe("Unrated");
  });
});

// ---------------------------------------------------------------------------
// Weight-based pricing
// ---------------------------------------------------------------------------

describe("calculatePricing — weight-based", () => {
  it("computes weightLb × pricePerLb and adds the Ghana service fee", () => {
    const result = calculatePricing(
      {
        pricingMode: "weight_based",
        items: [],
        weightLb: 10,
        routeCode: "USA-GHANA",
        destinationCountry: "Ghana",
        customerId: "c1",
      },
      ctx({ weightRateCard: weightCard(), route: route() }),
    );

    // 10 * 11.57 = 115.70
    expect(result.subtotal).toBe(115.7);
    expect(result.serviceFee).toBe(30);
    expect(result.total).toBe(145.7);
    expect(result.warnings).toEqual([]);
  });

  it("waives the service fee for Nigeria via serviceFeeByRoute override", () => {
    const result = calculatePricing(
      {
        pricingMode: "weight_based",
        items: [],
        weightLb: 10,
        routeCode: "USA-NIGERIA",
        destinationCountry: "Nigeria",
        customerId: "c1",
      },
      ctx({
        weightRateCard: weightCard({ id: "rc-ng", route: "USA-NIGERIA", pricePerLb: 6.5 }),
        route: route({ code: "USA-NIGERIA", countryName: "Nigeria", serviceFeeApplies: false, defaultRate: 6.5 }),
      }),
    );

    // 10 * 6.5 = 65, no fee
    expect(result.subtotal).toBe(65);
    expect(result.serviceFee).toBe(0);
    expect(result.total).toBe(65);
  });

  it("waives the service fee when the route's serviceFeeApplies is false (no settings override)", () => {
    // A route not present in serviceFeeByRoute falls back to route.serviceFeeApplies.
    const result = calculatePricing(
      {
        pricingMode: "weight_based",
        items: [],
        weightLb: 5,
        routeCode: "USA-FREE",
        destinationCountry: "Freeland",
        customerId: "c1",
      },
      ctx({
        weightRateCard: weightCard({ id: "rc-free", route: "USA-FREE", pricePerLb: 10 }),
        route: route({ code: "USA-FREE", countryName: "Freeland", serviceFeeApplies: false }),
      }),
    );

    expect(result.subtotal).toBe(50);
    expect(result.serviceFee).toBe(0);
  });

  it("warns when no per-pound rate and when weight is missing", () => {
    const result = calculatePricing(
      {
        pricingMode: "weight_based",
        items: [],
        weightLb: undefined,
        routeCode: "USA-UNKNOWN",
        destinationCountry: "Nowhere",
        customerId: "c1",
      },
      ctx({ weightRateCard: null, route: null }),
    );

    expect(result.subtotal).toBe(0);
    expect(result.warnings.some((w) => w.includes("per-pound rate"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("weight has not been entered"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// serviceFeeApplies
// ---------------------------------------------------------------------------

describe("serviceFeeApplies", () => {
  it("honours an explicit settings override over the route flag", () => {
    // settings says USA-NIGERIA => false, even though the route flag would say true
    expect(serviceFeeApplies(settings, route({ code: "USA-NIGERIA", serviceFeeApplies: true }), "USA-NIGERIA")).toBe(false);
  });

  it("falls back to the route flag when no settings override exists", () => {
    expect(serviceFeeApplies(settings, route({ serviceFeeApplies: true }), "USA-GHANA")).toBe(true);
    expect(serviceFeeApplies(settings, route({ serviceFeeApplies: false }), "USA-FOO")).toBe(false);
  });

  it("defaults to true when neither override nor route is present", () => {
    expect(serviceFeeApplies(settings, null, "USA-MYSTERY")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// selectActiveRateCard
// ---------------------------------------------------------------------------

describe("selectActiveRateCard", () => {
  it("ignores draft and expired cards and returns the active, in-window one", () => {
    const cards: RateCard[] = [
      itemCard({ id: "draft", status: "draft" }),
      itemCard({ id: "expired", status: "active", effectiveDate: PAST, expiryDate: PAST }),
      itemCard({ id: "good", status: "active" }),
    ];
    const picked = selectActiveRateCard(cards, "item_based", "USA-GHANA", undefined);
    expect(picked?.id).toBe("good");
  });

  it("prefers the most specific (route+country) card over a generic one", () => {
    const generic = itemCard({ id: "generic", route: undefined, country: undefined });
    const specific = itemCard({ id: "specific", route: "USA-GHANA", country: "Ghana" });
    const picked = selectActiveRateCard([generic, specific], "item_based", "USA-GHANA", "Ghana");
    expect(picked?.id).toBe("specific");
  });

  it("returns null when nothing matches the pricing type", () => {
    const picked = selectActiveRateCard([itemCard()], "weight_based", "USA-GHANA", undefined);
    expect(picked).toBeNull();
  });
});
