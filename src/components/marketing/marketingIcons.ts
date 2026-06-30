import {
  Plane,
  Ship,
  Package,
  Truck,
  FileCheck2,
  Warehouse,
  ShoppingCart,
  Layers,
  Radar,
  BadgeDollarSign,
  ShieldCheck,
  Headset,
  Gauge,
  Globe2,
  CalendarCheck,
  PackageCheck,
  Route,
  CheckCircle2,
  Boxes,
  Truck as TruckAlt,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated icon set selectable for marketing content cards. Content stores the
 * icon NAME (a string, Firestore-safe); the home page maps it to a component
 * via `marketingIcon(name)`. Keeping the set curated also keeps the bundle lean.
 */
export const MARKETING_ICONS = {
  Plane,
  Ship,
  Package,
  Truck,
  FileCheck2,
  Warehouse,
  ShoppingCart,
  Layers,
  Radar,
  BadgeDollarSign,
  ShieldCheck,
  Headset,
  Gauge,
  Globe2,
  CalendarCheck,
  PackageCheck,
  Route,
  CheckCircle2,
  Boxes,
} satisfies Record<string, LucideIcon>;

export type MarketingIconName = keyof typeof MARKETING_ICONS;

/** The names an editor can choose from. */
export const MARKETING_ICON_NAMES = Object.keys(MARKETING_ICONS) as MarketingIconName[];

/** Resolve a stored icon name to a component, falling back to a neutral box. */
export function marketingIcon(name: string): LucideIcon {
  return (MARKETING_ICONS as Record<string, LucideIcon>)[name] ?? TruckAlt;
}
