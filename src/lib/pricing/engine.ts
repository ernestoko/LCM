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
import { totalCbm } from "@/lib/utils/cbm";
import { isWithinWindow } from "@/lib/utils/dates";
import { computeCommission } from "./commission";

export interface PricingContext {
  /** Active item-based rate card (provides per-item unit prices). */
  itemRateCard?: RateCard | null;
  /** Active weight-based rate card (provides price per lb for the route). */
  weightRateCard?: RateCard | null;
  /** Active sea-freight rate card (per-CBM rate, minimum CBM, unit prices). */
  seaRateCard?: RateCard | null;
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

function resolvePricePerCbm(
  seaRateCard: RateCard | null | undefined,
  route: CountryRoute | null | undefined,
): number | null {
  if (seaRateCard && typeof seaRateCard.pricePerCbm === "number") return seaRateCard.pricePerCbm;
  if (route?.cargoType === "sea" && typeof route.defaultRatePerCbm === "number") {
    return route.defaultRatePerCbm;
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
    | "pricingMode"
    | "items"
    | "weightLb"
    | "routeCode"
    | "destinationCountry"
    | "customerId"
    | "cargoType"
    | "seaCargo"
  > & { customerSource?: string },
  ctx: PricingContext,
): PricingResult {
  const warnings: string[] = [];
  const lines: InvoiceLine[] = [];
  const route = ctx.route ?? null;
  const isSea = shipment.cargoType === "sea";
  // Currency comes from the card actually used for THIS shipment's pricing mode,
  // not whichever card happens to be non-null.
  const pricingCard = isSea
    ? ctx.seaRateCard
    : shipment.pricingMode === "item_based"
      ? ctx.itemRateCard
      : ctx.weightRateCard;
  const currency: CurrencyCode =
    (pricingCard?.currency ?? ctx.settings.defaultCurrency) || "USD";

  let usedCard: RateCard | null = null;

  // -------------------------------------------------------------------------
  // 1. Rated charge — sea (CBM + units), item, or weight
  // -------------------------------------------------------------------------
  if (isSea) {
    usedCard = ctx.seaRateCard ?? null;
    if (!usedCard) warnings.push("No active sea-freight rate card found for this route.");
    const cargo = shipment.seaCargo ?? { volumetric: [], units: [] };

    // 1a. Volumetric (per-CBM) charge with minimum billable CBM.
    const cbm = totalCbm(cargo);
    if (cbm > 0) {
      const ratePerCbm = resolvePricePerCbm(usedCard, route);
      if (ratePerCbm == null) warnings.push("No approved per-CBM rate found for this route.");
      const minCbm = usedCard?.minimumCbm ?? 0;
      const billable = Math.max(cbm, minCbm);
      const minNote = billable > cbm ? ` (min ${minCbm} CBM)` : "";
      lines.push({
        description: `Ocean freight — ${billable} CBM${minNote} @ ${currency} ${(ratePerCbm ?? 0).toFixed(2)}/CBM`,
        type: "cbm",
        quantity: billable,
        unitPrice: ratePerCbm ?? 0,
        amount: round2((ratePerCbm ?? 0) * billable),
      });
    }

    // 1b. Standard units (boxes / drums) at flat per-unit rates.
    for (const u of cargo.units) {
      const rate = usedCard?.items.find((r) => r.key === u.unitKey);
      if (!rate) warnings.push(`No approved price for unit "${u.label}".`);
      const unitPrice = rate?.unitPrice ?? 0;
      lines.push({
        description: `${u.label} × ${u.quantity}`,
        type: "unit",
        quantity: u.quantity,
        unitPrice,
        amount: round2(unitPrice * u.quantity),
      });
    }

    if (cbm === 0 && cargo.units.length === 0) {
      warnings.push("No sea cargo entered yet — add measured cargo or standard units.");
    }
  } else if (shipment.pricingMode === "item_based") {
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
