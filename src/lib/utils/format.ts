import type { CurrencyCode } from "@/types";

const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  USD: "en-US",
  GHS: "en-GH",
  NGN: "en-NG",
  EUR: "en-IE",
  GBP: "en-GB",
};

export function formatMoney(amount: number, currency: CurrencyCode = "USD"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatNumber(n: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatWeight(lb?: number): string {
  if (lb == null) return "—";
  return `${formatNumber(lb, 2)} lb`;
}

/** Round to 2 decimals avoiding binary float drift (e.g. 11.57 * 3.3). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function initials(name?: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleCase(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function truncate(s: string, max = 40): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
