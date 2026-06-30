"use client";

import { useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { useRoutes } from "@/lib/db/repositories/routes";
import {
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Select,
  Button,
  InfoBanner,
  useToast,
} from "@/components/ui";
import { PRICING_TYPE_LABELS } from "@/constants/statuses";
import { SEED_ITEM_RATES } from "@/constants/seed-data";
import type { PricingType, CurrencyCode, RateItem, RateCard } from "@/types";

const PRICING_TYPES: PricingType[] = ["item_based", "weight_based", "service_fee", "special_handling"];
const CURRENCIES: CurrencyCode[] = ["USD", "GHS", "NGN", "EUR", "GBP"];

interface ItemRow {
  key: string;
  label: string;
  condition: "new" | "used" | "any";
  unitPrice: string;
}

export interface RateCardFormState {
  name: string;
  pricingType: PricingType;
  route: string;
  country: string;
  currency: CurrencyCode;
  effectiveDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  items: ItemRow[];
  pricePerLb: string;
  serviceFeeAmount: string;
  waivedForCountries: string;
}

/** The assembled, validated payload handed back to the caller (create/update). */
export interface RateCardFormData {
  name: string;
  pricingType: PricingType;
  route?: string;
  country?: string;
  currency: CurrencyCode;
  items: RateItem[];
  effectiveDate: string; // ISO
  expiryDate?: string; // ISO
  pricePerLb?: number;
  serviceFee?: { amount: number; waivedForCountries: string[]; enabled: boolean };
}

function emptyItemRow(): ItemRow {
  return { key: "", label: "", condition: "any", unitPrice: "" };
}

function toList(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Convert a stored RateCard into the editable form state (for the edit page). */
export function cardToFormState(card: RateCard): RateCardFormState {
  return {
    name: card.name ?? "",
    pricingType: card.pricingType,
    route: card.route ?? "",
    country: card.country ?? "",
    currency: card.currency,
    effectiveDate: card.effectiveDate ? card.effectiveDate.slice(0, 10) : "",
    expiryDate: card.expiryDate ? card.expiryDate.slice(0, 10) : "",
    items:
      card.items && card.items.length > 0
        ? card.items.map((i) => ({
            key: i.key,
            label: i.label,
            condition: i.condition ?? "any",
            unitPrice: String(i.unitPrice),
          }))
        : [emptyItemRow()],
    pricePerLb: card.pricePerLb != null ? String(card.pricePerLb) : "",
    serviceFeeAmount: card.serviceFee ? String(card.serviceFee.amount) : "",
    waivedForCountries: card.serviceFee ? card.serviceFee.waivedForCountries.join(", ") : "",
  };
}

const DEFAULT_STATE: RateCardFormState = {
  name: "",
  pricingType: "item_based",
  route: "",
  country: "",
  currency: "USD",
  effectiveDate: "",
  expiryDate: "",
  items: [emptyItemRow()],
  pricePerLb: "",
  serviceFeeAmount: "",
  waivedForCountries: "",
};

/**
 * Shared rate-card editor used by both the "new" and "edit" pages, so creating
 * and editing pricing share exactly one validated form.
 */
export function RateCardForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
}: {
  initial?: RateCardFormState;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (data: RateCardFormData) => void;
}) {
  const { success, error: toastError } = useToast();
  const { data: routes } = useRoutes();
  const [form, setForm] = useState<RateCardFormState>(initial ?? DEFAULT_STATE);

  const usesItems = form.pricingType === "item_based" || form.pricingType === "special_handling";

  function set<K extends keyof RateCardFormState>(key: K, value: RateCardFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function setItem(index: number, patch: Partial<ItemRow>) {
    setForm((prev) => ({ ...prev, items: prev.items.map((row, i) => (i === index ? { ...row, ...patch } : row)) }));
  }
  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItemRow()] }));
  }
  function removeItem(index: number) {
    setForm((prev) => ({ ...prev, items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items }));
  }
  function loadDefaults() {
    setForm((prev) => ({
      ...prev,
      items: SEED_ITEM_RATES.map((r) => ({
        key: r.key,
        label: r.label,
        condition: r.condition ?? "any",
        unitPrice: String(r.unitPrice),
      })),
    }));
    success("Loaded default item rates.");
  }

  function buildItems(): RateItem[] {
    return form.items
      .filter((row) => row.label.trim() && row.unitPrice !== "")
      .map((row) => ({
        key: row.key.trim() || row.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
        label: row.label.trim(),
        condition: row.condition,
        unitPrice: Number(row.unitPrice),
        perUnit: "item" as const,
      }));
  }

  function handleSubmit() {
    if (!form.name.trim()) return toastError("A rate card name is required.");
    if (!form.effectiveDate) return toastError("An effective date is required.");
    const built = buildItems();
    if (usesItems && built.length === 0) return toastError("Add at least one item with a label and price.");
    if (form.pricingType === "weight_based" && (!form.pricePerLb || Number(form.pricePerLb) <= 0))
      return toastError("Enter a valid price per lb.");
    if (form.pricingType === "service_fee" && (!form.serviceFeeAmount || Number(form.serviceFeeAmount) < 0))
      return toastError("Enter a valid service fee amount.");

    onSubmit({
      name: form.name.trim(),
      pricingType: form.pricingType,
      route: form.route.trim() || undefined,
      country: form.country.trim() || undefined,
      currency: form.currency,
      items: usesItems ? built : [],
      effectiveDate: new Date(form.effectiveDate).toISOString(),
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
      ...(form.pricingType === "weight_based" ? { pricePerLb: Number(form.pricePerLb) } : {}),
      ...(form.pricingType === "service_fee"
        ? { serviceFee: { amount: Number(form.serviceFeeAmount), waivedForCountries: toList(form.waivedForCountries), enabled: true } }
        : {}),
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader title="Details" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="USA → Ghana item pricing" />
          </Field>
          <Field label="Pricing type" required>
            <Select value={form.pricingType} onChange={(e) => set("pricingType", e.target.value as PricingType)}>
              {PRICING_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PRICING_TYPE_LABELS[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Currency" required>
            <Select value={form.currency} onChange={(e) => set("currency", e.target.value as CurrencyCode)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Route" hint="Optional — leave blank to apply to all routes.">
            <Select value={form.route} onChange={(e) => set("route", e.target.value)}>
              <option value="">All routes</option>
              {routes.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.code} — {r.countryName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Country" hint="Optional.">
            <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Ghana" />
          </Field>
          <Field label="Effective date" required>
            <Input type="date" value={form.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
          </Field>
          <Field label="Expiry date" hint="Optional.">
            <Input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      {usesItems && (
        <Card>
          <CardHeader
            title={form.pricingType === "item_based" ? "Item rates" : "Special handling rates"}
            subtitle="One row per item. Unit price is in the selected currency."
            action={
              form.pricingType === "item_based" ? (
                <Button type="button" variant="outline" size="sm" onClick={loadDefaults}>
                  <Download className="h-4 w-4" /> Load default items
                </Button>
              ) : undefined
            }
          />
          <CardBody className="space-y-3">
            {form.items.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Input value={row.label} onChange={(e) => setItem(i, { label: e.target.value })} placeholder="Item label (e.g. New iPhone)" />
                </div>
                <div className="col-span-3">
                  <Select value={row.condition} onChange={(e) => setItem(i, { condition: e.target.value as ItemRow["condition"] })}>
                    <option value="any">Any</option>
                    <option value="new">New</option>
                    <option value="used">Used</option>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input type="number" min={0} step="0.01" value={row.unitPrice} onChange={(e) => setItem(i, { unitPrice: e.target.value })} placeholder="Price" />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={form.items.length === 1} aria-label="Remove item">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4" /> Add item
            </Button>
          </CardBody>
        </Card>
      )}

      {form.pricingType === "weight_based" && (
        <Card>
          <CardHeader title="Weight pricing" />
          <CardBody>
            <Field label="Price per lb" required hint="Charged per pound of billable weight.">
              <Input type="number" min={0} step="0.01" value={form.pricePerLb} onChange={(e) => set("pricePerLb", e.target.value)} placeholder="11.57" />
            </Field>
          </CardBody>
        </Card>
      )}

      {form.pricingType === "service_fee" && (
        <Card>
          <CardHeader title="Service fee" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Fee amount" required>
              <Input type="number" min={0} step="0.01" value={form.serviceFeeAmount} onChange={(e) => set("serviceFeeAmount", e.target.value)} placeholder="30" />
            </Field>
            <Field label="Waived for countries" hint="Comma-separated (e.g. Nigeria)." className="sm:col-span-2">
              <Input value={form.waivedForCountries} onChange={(e) => set("waivedForCountries", e.target.value)} placeholder="Nigeria" />
            </Field>
          </CardBody>
        </Card>
      )}

      <InfoBanner tone="warning">
        Edits keep the card a <strong>draft</strong> and bump its version — a <strong>Liberty Super
        Admin</strong> must approve it before it goes live. Every change is logged.
      </InfoBanner>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
