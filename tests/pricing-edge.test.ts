import { describe, it, expect } from "vitest";
import { selectActiveRateCard, serviceFeeApplies } from "@/lib/pricing/engine";
import { defaultPlatformSettings } from "@/lib/db/repositories/settings";
import type { RateCard, CountryRoute, PlatformSettings } from "@/types";

// The window check uses the real Date.now(), so fixtures use far-past / far-future
// ISO dates to stay deterministic regardless of when the suite runs.
const PAST = "2020-01-01T00:00:00.000Z";
const FUTURE = "2999-01-01T00:00:00.000Z";

function card(overrides: Partial<RateCard> = {}): RateCard {
  return {
    id: "rc",
    name: "Card",
    pricingType: "item_based",
    currency: "USD",
    items: [],
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
    id: "r",
    code: "USA-GHANA",
    countryName: "Ghana",
    countryCode: "GH",
    direction: "usa_to_country",
    pricingType: "weight_based",
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

describe("selectActiveRateCard — window edge cases", () => {
  it("ignores a card whose effectiveDate is in the future", () => {
    const cards = [card({ id: "future", effectiveDate: FUTURE })];
    expect(selectActiveRateCard(cards, "item_based")).toBeNull();
  });

  it("ignores a card whose expiryDate is in the past", () => {
    const cards = [card({ id: "expired-window", effectiveDate: PAST, expiryDate: PAST })];
    expect(selectActiveRateCard(cards, "item_based")).toBeNull();
  });

  it("returns the active in-window card when one valid card exists", () => {
    const cards = [card({ id: "ok", effectiveDate: PAST, expiryDate: FUTURE })];
    expect(selectActiveRateCard(cards, "item_based")?.id).toBe("ok");
  });

  it("returns null when only draft / expired / pending_approval cards exist", () => {
    const cards = [
      card({ id: "d", status: "draft" }),
      card({ id: "e", status: "expired" }),
      card({ id: "p", status: "pending_approval" }),
    ];
    expect(selectActiveRateCard(cards, "item_based")).toBeNull();
  });

  it("prefers a route+country specific active card over a generic active card", () => {
    const generic = card({ id: "generic", route: undefined, country: undefined });
    const specific = card({ id: "specific", route: "USA-GHANA", country: "Ghana" });
    const picked = selectActiveRateCard([generic, specific], "item_based", "USA-GHANA", "Ghana");
    expect(picked?.id).toBe("specific");
  });
});

describe("serviceFeeApplies — override precedence", () => {
  it("lets an explicit serviceFeeByRoute false win over route.serviceFeeApplies true", () => {
    // defaultPlatformSettings seeds serviceFeeByRoute["USA-NIGERIA"] = false.
    expect(settings.serviceFeeByRoute["USA-NIGERIA"]).toBe(false);
    const r = route({ code: "USA-NIGERIA", serviceFeeApplies: true });
    expect(serviceFeeApplies(settings, r, "USA-NIGERIA")).toBe(false);
  });

  it("falls back to route.serviceFeeApplies when there is no override", () => {
    expect(serviceFeeApplies(settings, route({ serviceFeeApplies: true }), "USA-GHANA")).toBe(true);
    expect(serviceFeeApplies(settings, route({ serviceFeeApplies: false }), "USA-OTHER")).toBe(false);
  });

  it("defaults to true with no route and no override", () => {
    expect(serviceFeeApplies(settings, null, "USA-MYSTERY")).toBe(true);
  });
});
