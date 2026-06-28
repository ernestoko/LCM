import { describe, it, expect } from "vitest";
import { pieceCbm, totalCbm, totalSeaPieces, round3 } from "@/lib/utils/cbm";
import type { SeaCargo } from "@/types";

describe("cbm utilities", () => {
  it("pieceCbm computes L×W×H (cm) ÷ 1,000,000 × quantity", () => {
    expect(pieceCbm({ lengthCm: 100, widthCm: 100, heightCm: 100, quantity: 1 })).toBe(1);
    expect(pieceCbm({ lengthCm: 100, widthCm: 100, heightCm: 100, quantity: 2 })).toBe(2);
    expect(pieceCbm({ lengthCm: 50, widthCm: 40, heightCm: 30, quantity: 2 })).toBe(0.12);
  });

  it("round3 rounds to three decimals", () => {
    expect(round3(0.123456)).toBe(0.123);
    expect(round3(1)).toBe(1);
  });

  it("totalCbm sums all volumetric pieces and ignores units", () => {
    const cargo: SeaCargo = {
      volumetric: [
        { id: "a", lengthCm: 100, widthCm: 100, heightCm: 100, quantity: 1 }, // 1.0
        { id: "b", lengthCm: 50, widthCm: 40, heightCm: 30, quantity: 2 }, // 0.12
      ],
      units: [{ id: "u", unitKey: "drum_200l", label: "200L Drum", quantity: 3 }],
    };
    expect(totalCbm(cargo)).toBe(1.12);
  });

  it("totalCbm returns 0 for empty / missing cargo", () => {
    expect(totalCbm(undefined)).toBe(0);
    expect(totalCbm({ volumetric: [], units: [] })).toBe(0);
  });

  it("totalSeaPieces counts volumetric quantities plus unit quantities", () => {
    const cargo: SeaCargo = {
      volumetric: [
        { id: "a", lengthCm: 100, widthCm: 100, heightCm: 100, quantity: 2 },
        { id: "b", lengthCm: 50, widthCm: 40, heightCm: 30, quantity: 1 },
      ],
      units: [{ id: "u", unitKey: "drum_200l", label: "200L Drum", quantity: 4 }],
    };
    expect(totalSeaPieces(cargo)).toBe(7); // 2 + 1 + 4
  });
});
