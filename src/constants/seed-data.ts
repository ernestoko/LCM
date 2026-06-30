import type {
  RateItem,
  CountryRoute,
  PricingType,
  RouteDirection,
} from "@/types";

/**
 * LCM Operations' approved initial price list.
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
// Sea-freight pricing — PLACEHOLDER rates. Sea cargo is billed by volume (CBM)
// or by standard units (boxes/drums). Real rates change often and are edited on
// the active sea rate card; these just seed a working starting point.
// ---------------------------------------------------------------------------

export const SEED_SEA_RATE = {
  pricePerCbm: 220, // placeholder per-CBM rate (USD)
  minimumCbm: 1, // bill at least 1 CBM
};

// ---------------------------------------------------------------------------
// Initial country routes — multi-directional global lanes.
//   • Outbound (USA → country) lanes (Ghana active at start; others draft).
//   • Inbound (country → USA) lanes so packages can originate anywhere.
//   • A `direction` and optional `origin`/`destination` describe each lane.
//     The `direction` field is backward compatible: existing consumers that
//     don't read it still work, and `countryName`/`countryCode` remain the
//     "non-USA endpoint" of the lane.
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
  /** Lane direction. Defaults to "usa_to_country" when omitted (back-compat). */
  direction?: RouteDirection;
  /** Optional explicit endpoints; default to USA ↔ countryName by direction. */
  origin?: string;
  destination?: string;
}

export const SEED_ROUTES: SeedRoute[] = [
  // --- Outbound: USA → country ------------------------------------------------
  { code: "USA-GHANA", countryName: "Ghana", countryCode: "GH", pricingType: "weight_based", pricePerLb: 11.57, transitTimeDays: 21, serviceFeeApplies: true, startActive: true, direction: "usa_to_country", origin: "United States", destination: "Ghana" },
  { code: "USA-LIBERIA", countryName: "Liberia", countryCode: "LR", pricingType: "weight_based", pricePerLb: 11.57, transitTimeDays: 28, serviceFeeApplies: true, startActive: false, direction: "usa_to_country", origin: "United States", destination: "Liberia" },
  { code: "USA-NIGERIA", countryName: "Nigeria", countryCode: "NG", pricingType: "weight_based", pricePerLb: 6.5, transitTimeDays: 28, serviceFeeApplies: false, startActive: false, direction: "usa_to_country", origin: "United States", destination: "Nigeria" },
  { code: "USA-CAMEROON", countryName: "Cameroon", countryCode: "CM", pricingType: "weight_based", pricePerLb: 15, transitTimeDays: 30, serviceFeeApplies: true, startActive: false, direction: "usa_to_country", origin: "United States", destination: "Cameroon" },
  { code: "USA-KENYA", countryName: "Kenya", countryCode: "KE", pricingType: "weight_based", pricePerLb: 15, transitTimeDays: 30, serviceFeeApplies: true, startActive: false, direction: "usa_to_country", origin: "United States", destination: "Kenya" },
  { code: "USA-SOUTHAFRICA", countryName: "South Africa", countryCode: "ZA", pricingType: "weight_based", pricePerLb: 15, transitTimeDays: 32, serviceFeeApplies: true, startActive: false, direction: "usa_to_country", origin: "United States", destination: "South Africa" },
  { code: "USA-UNITEDKINGDOM", countryName: "United Kingdom", countryCode: "GB", pricingType: "weight_based", pricePerLb: 9.5, transitTimeDays: 10, serviceFeeApplies: true, startActive: false, direction: "usa_to_country", origin: "United States", destination: "United Kingdom" },
  { code: "USA-CANADA", countryName: "Canada", countryCode: "CA", pricingType: "weight_based", pricePerLb: 7.25, transitTimeDays: 7, serviceFeeApplies: true, startActive: false, direction: "usa_to_country", origin: "United States", destination: "Canada" },
  // --- Inbound: country → USA -------------------------------------------------
  { code: "GHANA-USA", countryName: "Ghana", countryCode: "GH", pricingType: "weight_based", pricePerLb: 12.5, transitTimeDays: 18, serviceFeeApplies: true, startActive: true, direction: "country_to_usa", origin: "Ghana", destination: "United States" },
  { code: "NIGERIA-USA", countryName: "Nigeria", countryCode: "NG", pricingType: "weight_based", pricePerLb: 8.0, transitTimeDays: 20, serviceFeeApplies: false, startActive: false, direction: "country_to_usa", origin: "Nigeria", destination: "United States" },
  { code: "UNITEDKINGDOM-USA", countryName: "United Kingdom", countryCode: "GB", pricingType: "weight_based", pricePerLb: 9.75, transitTimeDays: 9, serviceFeeApplies: true, startActive: false, direction: "country_to_usa", origin: "United Kingdom", destination: "United States" },

  // --- China lanes (sourcing hub) — draft until Liberty activates + prices -----
  // China ⇄ USA (USA-hub directions)
  { code: "USA-CHINA", countryName: "China", countryCode: "CN", pricingType: "weight_based", pricePerLb: 9.5, transitTimeDays: 12, serviceFeeApplies: true, startActive: false, direction: "usa_to_country", origin: "United States", destination: "China" },
  { code: "CHINA-USA", countryName: "China", countryCode: "CN", pricingType: "weight_based", pricePerLb: 8.5, transitTimeDays: 14, serviceFeeApplies: true, startActive: false, direction: "country_to_usa", origin: "China", destination: "United States" },
  // China ⇄ Ghana (Ghana-hub directions)
  { code: "CHINA-GHANA", countryName: "China", countryCode: "CN", pricingType: "weight_based", pricePerLb: 10.0, transitTimeDays: 35, serviceFeeApplies: true, startActive: false, direction: "country_to_ghana", origin: "China", destination: "Ghana" },
  { code: "GHANA-CHINA", countryName: "China", countryCode: "CN", pricingType: "weight_based", pricePerLb: 11.0, transitTimeDays: 35, serviceFeeApplies: true, startActive: false, direction: "ghana_to_country", origin: "Ghana", destination: "China" },
  // China → other African destinations (country-to-country "international" lanes)
  { code: "CHINA-NIGERIA", countryName: "Nigeria", countryCode: "NG", pricingType: "weight_based", pricePerLb: 9.0, transitTimeDays: 38, serviceFeeApplies: false, startActive: false, direction: "international", origin: "China", destination: "Nigeria" },
  { code: "CHINA-KENYA", countryName: "Kenya", countryCode: "KE", pricingType: "weight_based", pricePerLb: 9.5, transitTimeDays: 34, serviceFeeApplies: true, startActive: false, direction: "international", origin: "China", destination: "Kenya" },
  { code: "CHINA-CAMEROON", countryName: "Cameroon", countryCode: "CM", pricingType: "weight_based", pricePerLb: 10.5, transitTimeDays: 40, serviceFeeApplies: true, startActive: false, direction: "international", origin: "China", destination: "Cameroon" },
  { code: "CHINA-SOUTHAFRICA", countryName: "South Africa", countryCode: "ZA", pricingType: "weight_based", pricePerLb: 9.5, transitTimeDays: 30, serviceFeeApplies: true, startActive: false, direction: "international", origin: "China", destination: "South Africa" },
  // Africa → China (return "international" lanes)
  { code: "NIGERIA-CHINA", countryName: "China", countryCode: "CN", pricingType: "weight_based", pricePerLb: 9.5, transitTimeDays: 38, serviceFeeApplies: false, startActive: false, direction: "international", origin: "Nigeria", destination: "China" },
];

/** Countries the platform serves both ways (origin AND destination). */
export const SUPPORTED_COUNTRIES = [
  "United States",
  "Ghana",
  "Liberia",
  "Nigeria",
  "Cameroon",
  "Kenya",
  "South Africa",
  "United Kingdom",
  "Canada",
  "China",
  "United Arab Emirates",
  "Germany",
  "Togo",
  "Côte d'Ivoire",
];

/** Countries selectable in forms during the pilot (kept for back-compat). */
export const PILOT_COUNTRIES = [
  "Ghana",
  "Liberia",
  "Nigeria",
  "Cameroon",
  "Kenya",
  "South Africa",
  "United States",
];

/** Shipments can originate anywhere the platform serves. */
export const ORIGIN_COUNTRIES = SUPPORTED_COUNTRIES;
