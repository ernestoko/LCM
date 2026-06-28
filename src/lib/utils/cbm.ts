import type { SeaCargo, SeaVolumetricPiece } from "@/types";

/** Round to 3 decimal places — the conventional precision for CBM (m³). */
export function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/** CBM (m³) for one volumetric line: L×W×H (cm) ÷ 1,000,000 × quantity. */
export function pieceCbm(
  p: Pick<SeaVolumetricPiece, "lengthCm" | "widthCm" | "heightCm" | "quantity">,
): number {
  const each = (p.lengthCm * p.widthCm * p.heightCm) / 1_000_000;
  return round3(each * (p.quantity || 0));
}

/** Total CBM across all volumetric pieces in a sea cargo. */
export function totalCbm(cargo: SeaCargo | undefined | null): number {
  if (!cargo?.volumetric?.length) return 0;
  return round3(cargo.volumetric.reduce((s, p) => s + pieceCbm(p), 0));
}

/** Count of physical pieces (volumetric quantities + unit quantities) — drives label count. */
export function totalSeaPieces(cargo: SeaCargo | undefined | null): number {
  if (!cargo) return 0;
  const v = cargo.volumetric.reduce((s, p) => s + (p.quantity || 0), 0);
  const u = cargo.units.reduce((s, p) => s + (p.quantity || 0), 0);
  return v + u;
}
