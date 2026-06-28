import { describe, it, expect } from "vitest";
import { stripUndefinedDeep, cleanForWrite } from "@/lib/utils/clean";

describe("stripUndefinedDeep", () => {
  it("removes nested undefined inside plain objects (the Firestore crash)", () => {
    const input = {
      a: 1,
      dimensions: { lengthIn: 10, widthIn: undefined, heightIn: undefined },
      deliveryProof: { recipientName: "Ama", signatureDataUrl: undefined, note: undefined },
    };
    const out = stripUndefinedDeep(input);
    expect(out).toEqual({
      a: 1,
      dimensions: { lengthIn: 10 },
      deliveryProof: { recipientName: "Ama" },
    });
    // No key should hold an undefined value anywhere.
    expect(JSON.stringify(out)).not.toContain("null");
    expect("widthIn" in (out.dimensions as object)).toBe(false);
  });

  it("strips undefined inside arrays of objects (manifest packages / invoice lines)", () => {
    const input = {
      packages: [
        { trackingNumber: "LCM-1", weightLb: 5, declaredValue: undefined },
        { trackingNumber: "LCM-2", weightLb: undefined, declaredValue: 100 },
      ],
    };
    const out = stripUndefinedDeep(input) as typeof input;
    expect(out.packages[0]).toEqual({ trackingNumber: "LCM-1", weightLb: 5 });
    expect(out.packages[1]).toEqual({ trackingNumber: "LCM-2", declaredValue: 100 });
  });

  it("leaves primitives, dates and non-plain objects untouched", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    const out = stripUndefinedDeep({ when: d, n: 0, s: "", b: false });
    expect((out as { when: Date }).when).toBe(d);
    expect(out).toEqual({ when: d, n: 0, s: "", b: false });
  });

  it("filters undefined elements out of arrays", () => {
    expect(stripUndefinedDeep([1, undefined, 2])).toEqual([1, 2]);
  });
});

describe("cleanForWrite", () => {
  it("drops the id field and deep-strips undefined", () => {
    const out = cleanForWrite({
      id: "abc",
      name: "X",
      nested: { keep: 1, drop: undefined },
      gone: undefined,
    });
    expect(out).toEqual({ name: "X", nested: { keep: 1 } });
    expect("id" in out).toBe(false);
    expect("gone" in out).toBe(false);
  });
});
