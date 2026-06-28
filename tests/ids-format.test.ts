import { describe, it, expect } from "vitest";
import {
  generateTrackingNumber,
  routeCode,
  formatInvoiceNumber,
  formatManifestNumber,
  formatPaymentNumber,
  formatTicketNumber,
  formatCustomerCode,
} from "@/lib/utils/ids";
import { round2, formatMoney, initials, titleCase } from "@/lib/utils/format";

describe("generateTrackingNumber", () => {
  it("matches the LCM-YYMM-XXXXXX format", () => {
    expect(generateTrackingNumber()).toMatch(/^LCM-\d{4}-[0-9A-Z]{6}$/);
  });

  it("embeds the supplied date's year/month", () => {
    // March 2026 => "2603"
    const tn = generateTrackingNumber(new Date(2026, 2, 15));
    expect(tn.startsWith("LCM-2603-")).toBe(true);
    expect(tn).toMatch(/^LCM-\d{4}-[0-9A-Z]{6}$/);
  });

  it("produces (practically) unique suffixes", () => {
    const a = generateTrackingNumber();
    const b = generateTrackingNumber();
    // The date prefix is shared; the random suffix should differ.
    expect(a.slice(0, 8)).toBe(b.slice(0, 8));
    expect(a).not.toBe(b);
  });
});

describe("routeCode", () => {
  it("normalises United States to USA", () => {
    expect(routeCode("United States", "Ghana")).toBe("USA-GHANA");
  });

  it("strips punctuation/spaces and uppercases", () => {
    expect(routeCode("united states of america", "South Africa")).toBe("USA-SOUTHAFRICA");
  });
});

describe("sequence formatters", () => {
  it("zero-pads invoice/manifest/payment/ticket to 6 and customer to 5", () => {
    expect(formatInvoiceNumber(123)).toBe("LCM-INV-000123");
    expect(formatManifestNumber(45)).toBe("LCM-MF-000045");
    expect(formatPaymentNumber(7)).toBe("LCM-PAY-000007");
    expect(formatTicketNumber(999999)).toBe("LCM-TKT-999999");
    expect(formatCustomerCode(123)).toBe("LCM-C-00123");
  });
});

describe("round2", () => {
  it("avoids float drift", () => {
    expect(round2(11.57 * 3)).toBeCloseTo(34.71, 2);
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(115.7)).toBe(115.7);
  });
});

describe("formatMoney", () => {
  it("renders USD with two decimals", () => {
    const s = formatMoney(85, "USD");
    expect(s).toContain("85.00");
  });

  it("coerces non-finite amounts to 0", () => {
    expect(formatMoney(Number.NaN, "USD")).toContain("0.00");
  });
});

describe("initials", () => {
  it("takes the first letter of up to two words, uppercased", () => {
    expect(initials("Ama Mensah")).toBe("AM");
    expect(initials("liberty cargo movers")).toBe("LC");
    expect(initials("")).toBe("?");
    expect(initials()).toBe("?");
  });
});

describe("titleCase", () => {
  it("converts snake/kebab case to Title Case", () => {
    expect(titleCase("ready_for_dispatch")).toBe("Ready For Dispatch");
    expect(titleCase("in-transit")).toBe("In Transit");
  });
});
