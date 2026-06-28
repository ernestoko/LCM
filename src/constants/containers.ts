import type { ContainerType } from "@/types";

export interface ContainerSpec {
  type: ContainerType;
  label: string;
  /** Practical usable volume in CBM (not the theoretical maximum). */
  capacityCbm: number;
}

/** Standard ocean container specs with realistic usable (loadable) volumes. */
export const CONTAINER_SPECS: ContainerSpec[] = [
  { type: "20ft", label: "20ft Standard", capacityCbm: 28 },
  { type: "40ft", label: "40ft Standard", capacityCbm: 58 },
  { type: "40ft_hc", label: "40ft High-Cube", capacityCbm: 68 },
];

export function containerSpec(type: ContainerType): ContainerSpec {
  return CONTAINER_SPECS.find((c) => c.type === type) ?? CONTAINER_SPECS[0];
}

export const LOAD_TYPE_LABEL: Record<"fcl" | "lcl", string> = {
  fcl: "FCL — Full Container Load",
  lcl: "LCL — Groupage (shared)",
};
