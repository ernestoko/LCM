import type {
  Shipment,
  RateCard,
  PlatformSettings,
  CountryRoute,
  InvoiceLine,
  CurrencyCode,
  CommissionBreakdown,
} from "@/types";
import { round2 } from "@/lib/utils/format";
import { isWithinWindow } from "@/lib/utils/dates";
import { computeCommission } from "./commission";

export interface PricingContext {
  /** Active item-based rate card (provides per-item unit prices). */
  itemRateCard?: RateCard | null;
  /** Active weight-based rate card (provides price per lb for the route). */
  weightRateCard?: RateCard | null;
  /** Country route for the shipment (service-fee + fallback rates). */
  route?: CountryRoute | null;
  settings: PlatformSettings;
}

export interface PricingResult {
  currency: CurrencyCode;
  lines: InvoiceLine[];
  subtotal: number; // SEAL's rated charge (items or weight)
  serviceFee: number;
  additionalCharges: number;
  total: number;
  commission: CommissionBreakdown;
  rateCardId: string;
  rateCardName: string;
  rateCardEffectiveDate: string;
  /** Non-fatal problems (e.g. missing price) surfaced to the operator. */
  warnings: string[];
}

/**
 * Pick the single active rate card of a given pricing type that is in its
 * effective window and matches the route/country (most specific wins).
 */
export function selectActiveRateCard(
  cards: RateCard[],
  pricingType: RateCard["pricingType"],
  routeCode?: string,
  country?: string,
): RateCard | null {
  const candidates = cards
    .filter((c) => c.status === "active" && c.pricingType === pricingType)
    .filter((c) => isWithinWindow(c.effectiveDate, c.expiryDate))
    .filter((c) => {
      const routeOk = !c.route || c.route === routeCode;
      const countryOk = !c.country || c.country === country;
      return routeOk && countryOk;
    });

  // Prefer the most specific (route+country) then newest effective date.
  candidates.sort((a, b) => {
    const specA = (a.route ? 2 : 0) + (a.country ? 1 : 0);
    const specB = (b.route ? 2 : 0) + (b.country ? 1 : 0);
    if (specA !== specB) return specB - specA;
    return b.effectiveDate.localeCompare(a.effectiveDate);
  });

  return candidates[0] ?? null;
}

function resolvePricePerLb(
  weightRateCard: RateCard | null | undefined,
  route: CountryRoute | null | undefined,
  destinationCountry: string,
): number | null {
  if (weightRateCard) {
    const byCountry = weightRateCard.items.find(
      (i) => i.label.toLowerCase() === destinationCountry.toLowerCase(),
    );
    if (byCountry) return byCountry.unitPrice;
    if (typeof weightRateCard.pricePerLb === "number") return weightRateCard.pricePerLb;
  }
  if (route?.pricingType === "weight_based" && typeof route.defaultRate === "number") {
    return route.defaultRate;
  }
  return null;
}

/** Whether the $service fee applies to this shipment's route. */
export function serviceFeeApplies(
  settings: PlatformSettings,
  route: CountryRoute | null | undefined,
  routeCode: string,
): boolean {
  // Explicit per-route override in settings wins.
  if (routeCode in settings.serviceFeeByRoute) {
    return settings.serviceFeeByRoute[routeCode];
  }
  if (route) return route.serviceFeeApplies;
  return true;
}

/**
 * Core pricing function. Pure & deterministic — given the same inputs it
 * always produces the same invoice. The active rate card is chosen by the
 * caller (repository) and passed in via the context.
 */
export function calculatePricing(
  shipment: Pick<
    Shipment,
    "pricingMode" | "items" | "weightLb" | "routeCode" | "destinationCountry" | "customerId"
  > & { customerSource?: string },
  ctx: PricingContext,
): PricingResult {
  const warnings: string[] = [];
  const lines: InvoiceLine[] = [];
  const route = ctx.route ?? null;
  const currency: CurrencyCode =
    (ctx.itemRateCard?.currency ?? ctx.weightRateCard?.currency ?? ctx.settings.defaultCurrency) ||
    "USD";

  let usedCard: RateCard | null = null;

  // -------------------------------------------------------------------------
  // 1. Item or weight charge (SEAL's rated price)
  // -------------------------------------------------------------------------
  if (shipment.pricingMode === "item_based") {
    usedCard = ctx.itemRateCard ?? null;
    if (!usedCard) warnings.push("No active item-based rate card found for this route.");
    for (const item of shipment.items) {
      const rate = usedCard?.items.find((r) => r.key === item.rateKey);
      if (!rate) {
        warnings.push(`No approved price for "${item.itemType}".`);
        lines.push({
          description: `${item.itemType}${item.description ? ` — ${item.description}` : ""}`,
          type: "item",
          quantity: item.quantity,
          unitPrice: 0,
          amount: 0,
        });
        continue;
      }
      const amount = round2(rate.unitPrice * item.quantity);
      lines.push({
        description: `${rate.label} × ${item.quantity}`,
        type: "item",
        quantity: item.quantity,
        unitPrice: rate.unitPrice,
        amount,
      });
    }
  } else {
    usedCard = ctx.weightRateCard ?? null;
    const pricePerLb = resolvePricePerLb(usedCard, route, shipment.destinationCountry);
    const weight = shipment.weightLb ?? 0;
    if (pricePerLb == null) {
      warnings.push("No approved per-pound rate found for this route.");
    }
    if (!weight) warnings.push("Package weight has not been entered yet.");
    const amount = round2((pricePerLb ?? 0) * weight);
    lines.push({
      description: `Freight — ${weight} lb @ ${currency} ${(pricePerLb ?? 0).toFixed(2)}/lb`,
      type: "weight",
      quantity: weight,
      unitPrice: pricePerLb ?? 0,
      amount,
    });
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));

  // -------------------------------------------------------------------------
  // 2. Service fee (configurable per route; waived e.g. for Nigeria)
  // -------------------------------------------------------------------------
  let serviceFee = 0;
  if (serviceFeeApplies(ctx.settings, route, shipment.routeCode)) {
    serviceFee = round2(ctx.settings.serviceFeeAmount || 0);
    if (serviceFee > 0) {
      lines.push({
        description: "Service Fee",
        type: "service_fee",
        quantity: 1,
        unitPrice: serviceFee,
        amount: serviceFee,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 3. Totals + commission
  // -------------------------------------------------------------------------
  const additionalCharges = 0; // special-handling lines added by caller if needed
  const total = round2(subtotal + serviceFee + additionalCharges);

  const commission = computeCommission({
    sealCharge: subtotal,
    serviceFee,
    settings: ctx.settings,
    customerSource: shipment.customerSource,
    routeCode: shipment.routeCode,
    itemCategory: shipment.items[0]?.category,
  });

  return {
    currency,
    lines,
    subtotal,
    serviceFee,
    additionalCharges,
    total,
    commission,
    rateCardId: usedCard?.id ?? "",
    rateCardName: usedCard?.name ?? "Unrated",
    rateCardEffectiveDate: usedCard?.effectiveDate ?? new Date().toISOString(),
    warnings,
  };
}
