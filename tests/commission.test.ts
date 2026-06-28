import { describe, it, expect } from "vitest";
import { computeCommission, defaultCommissionRules } from "@/lib/pricing/commission";
import { defaultPlatformSettings } from "@/lib/db/repositories/settings";
import type { PlatformSettings } from "@/types";

const settings: PlatformSettings = defaultPlatformSettings();

describe("computeCommission", () => {
  it("applies the full Liberty rate (15%) for a Liberty-sourced customer", () => {
    const c = computeCommission({
      sealCharge: 200,
      serviceFee: 30,
      settings,
      customerSource: "liberty",
    });
    // 15% of 200 = 30, platform fee 0
    expect(c.libertyCommission).toBe(30);
    expect(c.platformFee).toBe(0);
    expect(c.libertyEarnings).toBe(30); // commission + platformFee
    expect(c.sealCharge).toBe(200);
    expect(c.serviceFee).toBe(30);
  });

  it("applies the reduced rate (5%) for a SEAL-sourced customer — lower than Liberty", () => {
    const seal = computeCommission({ sealCharge: 200, serviceFee: 0, settings, customerSource: "seal" });
    const liberty = computeCommission({ sealCharge: 200, serviceFee: 0, settings, customerSource: "liberty" });
    // 5% of 200 = 10
    expect(seal.libertyCommission).toBe(10);
    expect(seal.libertyEarnings).toBeLessThan(liberty.libertyEarnings);
  });

  it("adds the platform fee for an online-sourced customer", () => {
    const c = computeCommission({ sealCharge: 100, serviceFee: 0, settings, customerSource: "online" });
    // 10% of 100 = 10, + 2 platform fee = 12
    expect(c.libertyCommission).toBe(10);
    expect(c.platformFee).toBe(2);
    expect(c.libertyEarnings).toBe(12);
  });

  it("falls back to platform defaults when no rule matches", () => {
    const c = computeCommission({ sealCharge: 100, serviceFee: 0, settings, customerSource: "walk_in" });
    // defaultCommissionPercent = 10, defaultPlatformFee = 0
    expect(c.libertyCommission).toBe(10);
    expect(c.platformFee).toBe(0);
    expect(c.libertyEarnings).toBe(10);
    expect(c.basis).toContain("default");
  });

  it("lets the most specific rule win — customerSource beats route beats category", () => {
    const custom: PlatformSettings = {
      ...settings,
      commissionRules: [
        { itemCategory: "phone", commissionPercent: 1, platformFeePerShipment: 0 },
        { routeCode: "USA-GHANA", commissionPercent: 2, platformFeePerShipment: 0 },
        { customerSource: "liberty", commissionPercent: 20, platformFeePerShipment: 0 },
      ],
    };
    const c = computeCommission({
      sealCharge: 100,
      serviceFee: 0,
      settings: custom,
      customerSource: "liberty",
      routeCode: "USA-GHANA",
      itemCategory: "phone",
    });
    // customerSource rule (score 4) wins => 20%
    expect(c.libertyCommission).toBe(20);
    expect(c.basis).toContain("source=liberty");
  });

  it("falls through to a route rule when no customerSource rule matches", () => {
    const custom: PlatformSettings = {
      ...settings,
      commissionRules: [
        { customerSource: "liberty", commissionPercent: 20, platformFeePerShipment: 0 },
        { routeCode: "USA-GHANA", commissionPercent: 8, platformFeePerShipment: 1 },
      ],
    };
    const c = computeCommission({
      sealCharge: 100,
      serviceFee: 0,
      settings: custom,
      customerSource: "walk_in", // no liberty match
      routeCode: "USA-GHANA",
    });
    // route rule applies => 8% of 100 = 8, + 1 fee
    expect(c.libertyCommission).toBe(8);
    expect(c.platformFee).toBe(1);
    expect(c.libertyEarnings).toBe(9);
    expect(c.basis).toContain("route=USA-GHANA");
  });
});

describe("defaultCommissionRules", () => {
  it("seeds liberty/seal/online with the expected percentages", () => {
    const rules = defaultCommissionRules();
    const bySource = Object.fromEntries(rules.map((r) => [r.customerSource, r]));
    expect(bySource.liberty.commissionPercent).toBe(15);
    expect(bySource.seal.commissionPercent).toBe(5);
    expect(bySource.online.commissionPercent).toBe(10);
    expect(bySource.online.platformFeePerShipment).toBe(2);
  });
});
