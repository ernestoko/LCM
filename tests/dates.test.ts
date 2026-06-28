import { describe, it, expect } from "vitest";
import { isWithinWindow, daysBetween, addMonths, formatDate, toISO } from "@/lib/utils/dates";

const PAST = "2020-01-01T00:00:00.000Z";
const FUTURE = "2999-01-01T00:00:00.000Z";

describe("isWithinWindow", () => {
  it("is true when effective is in the past and there is no expiry", () => {
    expect(isWithinWindow(PAST, undefined)).toBe(true);
  });

  it("is true when now is between a past effective and a future expiry", () => {
    expect(isWithinWindow(PAST, FUTURE)).toBe(true);
  });

  it("is false when the expiry is in the past", () => {
    expect(isWithinWindow(PAST, PAST)).toBe(false);
  });

  it("is false when the effective date is in the future", () => {
    expect(isWithinWindow(FUTURE, undefined)).toBe(false);
  });

  it("is true when both dates are undefined (open window)", () => {
    expect(isWithinWindow(undefined, undefined)).toBe(true);
  });
});

describe("daysBetween", () => {
  it("returns the correct positive day count", () => {
    expect(daysBetween("2026-01-01T00:00:00.000Z", "2026-01-11T00:00:00.000Z")).toBe(10);
  });

  it("returns 0 for identical timestamps", () => {
    expect(daysBetween("2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z")).toBe(0);
  });

  it("returns null when an input is invalid", () => {
    expect(daysBetween("not-a-date", "2026-01-11T00:00:00.000Z")).toBeNull();
  });

  it("returns null when an input is null", () => {
    expect(daysBetween(null, "2026-01-11T00:00:00.000Z")).toBeNull();
  });
});

describe("addMonths", () => {
  it("advances January by 6 months to land in July", () => {
    const result = addMonths("2026-01-15T00:00:00.000Z", 6);
    // Month index 6 === July, regardless of the rendered timezone offset.
    expect(new Date(result).getMonth()).toBe(6);
    expect(typeof result).toBe("string");
  });
});

describe("formatDate", () => {
  it("returns the em-dash fallback for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("returns the em-dash fallback for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formats a valid ISO date using the default pattern", () => {
    expect(formatDate("2026-01-15T00:00:00.000Z", "yyyy")).toBe("2026");
  });
});

describe("toISO", () => {
  it("passes a string through unchanged", () => {
    expect(toISO(PAST)).toBe(PAST);
  });
});
