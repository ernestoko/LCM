import type {
  RateItem,
  CountryRoute,
  PricingType,
} from "@/types";

/**
 * SEAL's approved initial price list for the 6-month outsourcing pilot.
 * These values seed the first ACTIVE rate cards. All future changes flow
 * through the approval + audit workflow in the Rate Cards module.
 */

// ---------------------------------------------------------------------------
// Item-based pricing (per item, applies on USA → Ghana and most routes)
// ---------------------------------------------------------------------------

export const SEED_ITEM_RATES: RateItem[] = [
  { key: "iphone_new", label: "New iPhone", condition: "new", unitPrice: 85, perUnit: "item" },
  { key: "iphone_used", label: "Used iPhone", condition: "used", unitPrice: 55, perUnit: "item" },
  { key: "phone_other_new", label: "Other New Phone", condition: "new", unitPrice: 75, perUnit: "item" },
  { key: "phone_other_used", label: "Other Used Phone", condition: "used", unitPrice: 50, perUnit: "item" },
  { key: "ipad_new", label: "New iPad", condition: "new", unitPrice: 85, perUnit: "item" },
  { key: "ipad_used", label: "Used iPad", condition: "used", unitPrice: 50, perUnit: "item" },
  { key: "tablet_new", label: "New Tablet", condition: "new", unitPrice: 75, perUnit: "item" },
  { key: "tablet_used", label: "Used Tablet", condition: "used", unitPrice: 45, perUnit: "item" },
  { key: "mac_laptop_new", label: "New Mac Laptop", condition: "new", unitPrice: 100, perUnit: "item" },
  { key: "mac_laptop_used", label: "Used Mac Laptop", condition: "used", unitPrice: 85, perUnit: "item" },
  { key: "laptop_other_new", label: "Other New Laptop", condition: "new", unitPrice: 85, perUnit: "item" },
  { key: "laptop_other_used", label: "Other Used Laptop", condition: "used", unitPrice: 70, perUnit: "item" },
  { key: "apple_watch_new", label: "New Apple Watch", condition: "new", unitPrice: 50, perUnit: "item" },
  { key: "apple_watch_used", label: "Used Apple Watch", condition: "used", unitPrice: 35, perUnit: "item" },
  { key: "airpods_new", label: "New Apple AirPods", condition: "new", unitPrice: 50, perUnit: "item" },
  { key: "airpods_used", label: "Used Apple AirPods", condition: "used", unitPrice: 35, perUnit: "item" },
];

/** Category grouping used by the shipment form item picker. */
export const ITEM_CATEGORIES: Record<string, string[]> = {
  phone: ["iphone_new", "iphone_used", "phone_other_new", "phone_other_used"],
  tablet: ["ipad_new", "ipad_used", "tablet_new", "tablet_used"],
  laptop: ["mac_laptop_new", "mac_laptop_used", "laptop_other_new", "laptop_other_used"],
  wearable: ["apple_watch_new", "apple_watch_used"],
  audio: ["airpods_new", "airpods_used"],
};

// ---------------------------------------------------------------------------
// Weight-based pricing (per lb) keyed by country
// ---------------------------------------------------------------------------

export interface SeedWeightRate {
  countries: string[];
  pricePerLb: number;
}

export const SEED_WEIGHT_RATES: SeedWeightRate[] = [
  { countries: ["Liberia", "Ghana"], pricePerLb: 11.57 },
  { countries: ["Nigeria"], pricePerLb: 6.5 },
  { countries: ["Cameroon", "Kenya", "South Africa"], pricePerLb: 15 },
];

// ---------------------------------------------------------------------------
// Service fee — $30, applied on all routes EXCEPT Nigeria. Configurable.
// ---------------------------------------------------------------------------

export const SEED_SERVICE_FEE = {
  amount: 30,
  waivedForCountries: ["Nigeria"],
  enabled: true,
};

// ---------------------------------------------------------------------------
// Initial country routes — only Ghana is approved/active at pilot start.
// ---------------------------------------------------------------------------

export interface SeedRoute {
  code: string;
  countryName: string;
  countryCode: string;
  pricingType: PricingType;
  pricePerLb?: number;
  transitTimeDays: number;
  serviceFeeApplies: boolean;
  startActive: boolean;
}

export const SEED_ROUTES: SeedRoute[] = [
  { code: "USA-GHANA", countryName: "Ghana", countryCode: "GH", pricingType: "weight_based", pricePerLb: 11.57, transitTimeDays: 21, serviceFeeApplies: true, startActive: true },
  { code: "USA-LIBERIA", countryName: "Liberia", countryCode: "LR", pricingType: "weight_based", pricePerLb: 11.57, transitTimeDays: 28, serviceFeeApplies: true, startActive: false },
  { code: "USA-NIGERIA", countryName: "Nigeria", countryCode: "NG", pricingType: "weight_based", pricePerLb: 6.5, transitTimeDays: 28, serviceFeeApplies: false, startActive: false },
  { code: "USA-CAMEROON", countryName: "Cameroon", countryCode: "CM", pricingType: "weight_based", pricePerLb: 15, transitTimeDays: 30, serviceFeeApplies: true, startActive: false },
  { code: "USA-KENYA", countryName: "Kenya", countryCode: "KE", pricingType: "weight_based", pricePerLb: 15, transitTimeDays: 30, serviceFeeApplies: true, startActive: false },
  { code: "USA-SOUTHAFRICA", countryName: "South Africa", countryCode: "ZA", pricingType: "weight_based", pricePerLb: 15, transitTimeDays: 32, serviceFeeApplies: true, startActive: false },
];

/** Countries selectable in forms during the pilot. */
export const PILOT_COUNTRIES = [
  "Ghana",
  "Liberia",
  "Nigeria",
  "Cameroon",
  "Kenya",
  "South Africa",
  "United States",
];

export const ORIGIN_COUNTRIES = ["United States"];
