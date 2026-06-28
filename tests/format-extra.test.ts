import { describe, it, expect } from "vitest";
import { formatWeight, titleCase, truncate, initials, formatNumber } from "@/lib/utils/format";

describe("formatWeight", () => {
  it("formats a number with two decimals and a lb suffix", () => {
    expect(formatWeight(12.5)).toContain("12.50 lb");
  });

  it("returns the em-dash fallback for undefined", () => {
    expect(formatWeight(undefined)).toBe("—");
  });
});

describe("titleCase", () => {
  it("replaces underscores and capitalises each word", () => {
    expect(titleCase("new_iphone")).toBe("New Iphone");
  });

  it("replaces hyphens too", () => {
    expect(titleCase("usa-ghana")).toBe("Usa Ghana");
  });
});

describe("truncate", () => {
  it("trims to the max length and appends an ellipsis", () => {
    const result = truncate("abcdefghij", 5);
    expect(result.length).toBeLessThanOrEqual(5);
    expect(result.endsWith("…")).toBe(true);
  });

  it("leaves a string shorter than max unchanged", () => {
    expect(truncate("abc", 5)).toBe("abc");
  });
});

describe("initials", () => {
  it("returns the first letter of the first two words, uppercased", () => {
    expect(initials("Kwame Adjei")).toBe("KA");
  });

  it("returns ? for undefined", () => {
    expect(initials(undefined)).toBe("?");
  });
});

describe("formatNumber", () => {
  it("formats with the requested fraction digits", () => {
    expect(formatNumber(1.5, 2)).toBe("1.50");
  });

  it("coerces non-finite input to 0", () => {
    expect(formatNumber(Number.NaN)).toBe("0");
  });
});
