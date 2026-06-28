import type {
  PlatformSettings,
  CommissionBreakdown,
  CommissionRule,
  CustomerSource,
} from "@/types";
import { round2 } from "@/lib/utils/format";

export interface CommissionInput {
  /** SEAL's rated charge (item/weight subtotal). */
  sealCharge: number;
  serviceFee: number;
  settings: PlatformSettings;
  customerSource?: string;
  routeCode?: string;
  itemCategory?: string;
}

/**
 * Score how specifically a rule matches the context. Higher = more specific.
 * Returns -1 if the rule contradicts a provided value (no match).
 */
function ruleScore(rule: CommissionRule, input: CommissionInput): number {
  let score = 0;
  if (rule.customerSource !== undefined) {
    if (rule.customerSource !== input.customerSource) return -1;
    score += 4;
  }
  if (rule.routeCode !== undefined) {
    if (rule.routeCode !== input.routeCode) return -1;
    score += 2;
  }
  if (rule.itemCategory !== undefined) {
    if (rule.itemCategory !== input.itemCategory) return -1;
    score += 1;
  }
  return score;
}

/**
 * Compute Liberty's earnings on a shipment.
 *
 * Liberty earns through (a) a commission percentage applied to SEAL's rated
 * charge and (b) a fixed platform fee per shipment. The most specific matching
 * commission rule wins; otherwise platform defaults apply.
 *
 * Customer-source rules from the brief:
 *  - Liberty-sourced customer → Liberty commission applies.
 *  - SEAL-sourced customer    → commission can be lower / zero.
 *  - Platform-only shipment   → platform fee applies.
 */
export function computeCommission(input: CommissionInput): CommissionBreakdown {
  const { settings, sealCharge, serviceFee } = input;

  const matches = settings.commissionRules
    .map((rule) => ({ rule, score: ruleScore(rule, input) }))
    .filter((m) => m.score >= 0)
    .sort((a, b) => b.score - a.score);

  const winner = matches[0]?.rule;

  const commissionPercent = winner
    ? winner.commissionPercent
    : settings.defaultCommissionPercent;
  const platformFee = winner
    ? winner.platformFeePerShipment
    : settings.defaultPlatformFeePerShipment;

  const libertyCommission = round2((sealCharge * commissionPercent) / 100);
  const libertyEarnings = round2(libertyCommission + platformFee);

  const basisParts: string[] = [];
  if (winner) {
    if (winner.customerSource) basisParts.push(`source=${winner.customerSource}`);
    if (winner.routeCode) basisParts.push(`route=${winner.routeCode}`);
    if (winner.itemCategory) basisParts.push(`category=${winner.itemCategory}`);
  }
  const basis = `${commissionPercent}% of SEAL charge${
    platformFee ? ` + ${platformFee} platform fee` : ""
  }${basisParts.length ? ` (rule: ${basisParts.join(", ")})` : " (default)"}`;

  return {
    sealCharge: round2(sealCharge),
    serviceFee: round2(serviceFee),
    libertyCommission,
    platformFee: round2(platformFee),
    libertyEarnings,
    basis,
  };
}

/** Default commission rules seeded into platform settings. */
export function defaultCommissionRules(): CommissionRule[] {
  return [
    {
      customerSource: "liberty" as CustomerSource,
      commissionPercent: 15,
      platformFeePerShipment: 0,
      note: "Liberty-sourced customers — full commission.",
    },
    {
      customerSource: "seal" as CustomerSource,
      commissionPercent: 5,
      platformFeePerShipment: 0,
      note: "SEAL-sourced customers — reduced commission.",
    },
    {
      customerSource: "online" as CustomerSource,
      commissionPercent: 10,
      platformFeePerShipment: 2,
      note: "Online customers — platform fee applies.",
    },
  ];
}
