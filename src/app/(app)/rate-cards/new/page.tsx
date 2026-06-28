"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Download } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useActor } from "@/lib/auth/AuthProvider";
import { createRateCard, type NewRateCard } from "@/lib/db/repositories/rateCards";
import { useRoutes } from "@/lib/db/repositories/routes";
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Select,
  InfoBanner,
  useToast,
} from "@/components/ui";
import { PRICING_TYPE_LABELS } from "@/constants/statuses";
import { SEED_ITEM_RATES } from "@/constants/seed-data";
import type { PricingType, CurrencyCode, RateItem } from "@/types";

const PRICING_TYPES: PricingType[] = [
  "item_based",
  "weight_based",
  "service_fee",
  "special_handling",
];
const CURRENCIES: CurrencyCode[] = ["USD", "GHS", "NGN", "EUR", "GBP"];

interface ItemRow {
  key: string;
  label: string;
  condition: "new" | "used" | "any";
  unitPrice: string;
}

function emptyItemRow(): ItemRow {
  return { key: "", label: "", condition: "any", unitPrice: "" };
}

function toList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function NewRateCardPage() {
  return (
    <RequirePermission permission="rates.create">
      <NewRateCard />
    </RequirePermission>
  );
}

function NewRateCard() {
  const router = useRouter();
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const { data: routes } = useRoutes();

  const [name, setName] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("item_based");
  const [route, setRoute] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // item_based / special_handling
  const [items, setItems] = useState<ItemRow[]>([emptyItemRow()]);

  // weight_based
  const [pricePerLb, setPricePerLb] = useState("");

  // service_fee
  const [serviceFeeAmount, setServiceFeeAmount] = useState("");
  const [waivedForCountries, setWaivedForCountries] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const usesItems = pricingType === "item_based" || pricingType === "special_handling";

  function setItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItemRow()]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function loadSealDefaults() {
    setItems(
      SEED_ITEM_RATES.map((r) => ({
        key: r.key,
        label: r.label,
        condition: r.condition ?? "any",
        unitPrice: String(r.unitPrice),
      })),
    );
    success("Loaded SEAL default item rates.");
  }

  function buildItems(): RateItem[] {
    return items
      .filter((row) => row.label.trim() && row.unitPrice !== "")
      .map((row) => ({
        key:
          row.key.trim() ||
          row.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
        label: row.label.trim(),
        condition: row.condition,
        unitPrice: Number(row.unitPrice),
        perUnit: "item" as const,
      }));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toastError("A rate card name is required.");
      return;
    }
    if (!effectiveDate) {
      toastError("An effective date is required.");
      return;
    }

    const built = buildItems();
    if (usesItems && built.length === 0) {
      toastError("Add at least one item with a label and price.");
      return;
    }
    if (pricingType === "weight_based" && (!pricePerLb || Number(pricePerLb) <= 0)) {
      toastError("Enter a valid price per lb.");
      return;
    }
    if (pricingType === "service_fee" && (!serviceFeeAmount || Number(serviceFeeAmount) < 0)) {
      toastError("Enter a valid service fee amount.");
      return;
    }

    const data: NewRateCard = {
      name: name.trim(),
      pricingType,
      route: route.trim() || undefined,
      country: country.trim() || undefined,
      currency,
      items: usesItems ? built : [],
      effectiveDate: new Date(effectiveDate).toISOString(),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      uploadedBy: actor.uid,
      uploadedByName: actor.name,
      ...(pricingType === "weight_based" ? { pricePerLb: Number(pricePerLb) } : {}),
      ...(pricingType === "service_fee"
        ? {
            serviceFee: {
              amount: Number(serviceFeeAmount),
              waivedForCountries: toList(waivedForCountries),
              enabled: true,
            },
          }
        : {}),
    };

    setSubmitting(true);
    try {
      await createRateCard(data, actor);
      success("Rate card created as a draft. Submit it for Super Admin approval to activate.");
      router.push("/rate-cards");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create rate card.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href="/rate-cards"
        className="mb-3 inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to rate cards
      </Link>

      <PageHeader
        title="New Rate Card"
        description="Define pilot pricing. The card is created as a draft and requires Liberty Super Admin approval to become active."
      />

      <InfoBanner tone="warning">
        This rate card will be created as a <strong>DRAFT</strong>. After you submit it for
        approval, a <strong>Liberty Super Admin</strong> must approve it before it becomes active.
        Every change is logged.
      </InfoBanner>

      <div className="mt-6 max-w-3xl space-y-6">
        <Card>
          <CardHeader title="Details" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required className="sm:col-span-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="USA → Ghana item pricing"
              />
            </Field>

            <Field label="Pricing type" required>
              <Select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as PricingType)}
              >
                {PRICING_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {PRICING_TYPE_LABELS[p]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Currency" required>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Route" hint="Optional — leave blank to apply to all routes.">
              <Select value={route} onChange={(e) => setRoute(e.target.value)}>
                <option value="">All routes</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.code}>
                    {r.code} — {r.countryName}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Country" hint="Optional.">
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ghana"
              />
            </Field>

            <Field label="Effective date" required>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </Field>

            <Field label="Expiry date" hint="Optional.">
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </Field>
          </CardBody>
        </Card>

        {/* Item-based / special-handling editor */}
        {usesItems && (
          <Card>
            <CardHeader
              title={pricingType === "item_based" ? "Item rates" : "Special handling rates"}
              subtitle="One row per item. Unit price is in the selected currency."
              action={
                pricingType === "item_based" ? (
                  <Button type="button" variant="outline" size="sm" onClick={loadSealDefaults}>
                    <Download className="h-4 w-4" /> Load SEAL default items
                  </Button>
                ) : undefined
              }
            />
            <CardBody className="space-y-3">
              {items.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Input
                      value={row.label}
                      onChange={(e) => setItem(i, { label: e.target.value })}
                      placeholder="Item label (e.g. New iPhone)"
                    />
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={row.condition}
                      onChange={(e) =>
                        setItem(i, { condition: e.target.value as ItemRow["condition"] })
                      }
                    >
                      <option value="any">Any</option>
                      <option value="new">New</option>
                      <option value="used">Used</option>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(e) => setItem(i, { unitPrice: e.target.value })}
                      placeholder="Price"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                      aria-label="Remove item"
                    >
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

        {/* Weight-based */}
        {pricingType === "weight_based" && (
          <Card>
            <CardHeader title="Weight pricing" />
            <CardBody>
              <Field label="Price per lb" required hint="Charged per pound of billable weight.">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={pricePerLb}
                  onChange={(e) => setPricePerLb(e.target.value)}
                  placeholder="11.57"
                />
              </Field>
            </CardBody>
          </Card>
        )}

        {/* Service fee */}
        {pricingType === "service_fee" && (
          <Card>
            <CardHeader title="Service fee" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Fee amount" required>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={serviceFeeAmount}
                  onChange={(e) => setServiceFeeAmount(e.target.value)}
                  placeholder="30"
                />
              </Field>
              <Field
                label="Waived for countries"
                hint="Comma-separated (e.g. Nigeria)."
                className="sm:col-span-2"
              >
                <Input
                  value={waivedForCountries}
                  onChange={(e) => setWaivedForCountries(e.target.value)}
                  placeholder="Nigeria"
                />
              </Field>
            </CardBody>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/rate-cards">
            <Button variant="outline" disabled={submitting}>
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
            Create draft rate card
          </Button>
        </div>
      </div>
    </div>
  );
}
