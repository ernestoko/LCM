/**
 * Catalog of standard sea-freight units (boxes & drums).
 *
 * `defaultPrice` is a PLACEHOLDER only — the authoritative price for each unit
 * lives on the active sea rate card (a RateItem with the same `key`). Admins set
 * real rates there; this catalog seeds the rate card and powers the intake unit
 * picker. `approxCbm` is the volume each unit occupies, used for container-fill
 * estimates so LCL groupage accounts for units, not just loose cargo.
 */
export interface SeaUnitDef {
  key: string;
  label: string;
  defaultPrice: number;
  approxCbm: number;
}

export const SEA_UNIT_DEFS: SeaUnitDef[] = [
  { key: "drum_200l", label: "200L Drum", defaultPrice: 150, approxCbm: 0.23 },
  { key: "drum_100l", label: "100L Half-Drum / Barrel", defaultPrice: 90, approxCbm: 0.12 },
  { key: "box_small", label: "Small Box (≤ 18 in)", defaultPrice: 40, approxCbm: 0.05 },
  { key: "box_medium", label: "Medium Box (≤ 24 in)", defaultPrice: 60, approxCbm: 0.1 },
  { key: "box_large", label: "Large Box (≤ 30 in)", defaultPrice: 85, approxCbm: 0.16 },
];

export function seaUnitDef(key: string): SeaUnitDef | undefined {
  return SEA_UNIT_DEFS.find((u) => u.key === key);
}

/** Approximate CBM a list of sea units occupies (for container-fill estimates). */
export function unitsApproxCbm(units: { unitKey: string; quantity: number }[]): number {
  return units.reduce((s, u) => s + (seaUnitDef(u.unitKey)?.approxCbm ?? 0) * (u.quantity || 0), 0);
}
