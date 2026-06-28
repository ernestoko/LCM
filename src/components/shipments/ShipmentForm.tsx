"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import type {
  ContactParty,
  ShipmentItem,
  Customer,
} from "@/types";
import type { NewShipment } from "@/lib/db/repositories/shipments";
import { useCustomers } from "@/lib/db/repositories/customers";
import { useRateCards } from "@/lib/db/repositories/rateCards";
import { useRoutes } from "@/lib/db/repositories/routes";
import { usePlatformSettings } from "@/lib/db/repositories/settings";
import { calculatePricing, selectActiveRateCard } from "@/lib/pricing/engine";
import { routeCode as makeRouteCode } from "@/lib/utils/ids";
import { formatMoney } from "@/lib/utils/format";
import {
  ITEM_CATEGORIES,
  SEED_ITEM_RATES,
  ORIGIN_COUNTRIES,
  SUPPORTED_COUNTRIES,
} from "@/constants/seed-data";
import { PRICING_TYPE_LABELS } from "@/constants/statuses";
import {
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  Label,
  InfoBanner,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";

type PricingMode = "item_based" | "weight_based";

interface ItemRow {
  category: string;
  rateKey: string;
  quantity: number;
  description: string;
}

const ITEM_CATEGORY_KEYS = Object.keys(ITEM_CATEGORIES);

function emptyContact(): ContactParty {
  return { name: "", phone: "", email: "", address: "", country: "", city: "" };
}

function newItemRow(): ItemRow {
  const firstCategory = ITEM_CATEGORY_KEYS[0];
  const firstKey = ITEM_CATEGORIES[firstCategory]?.[0] ?? "";
  return { category: firstCategory, rateKey: firstKey, quantity: 1, description: "" };
}

function ratesForCategory(category: string) {
  const keys = ITEM_CATEGORIES[category] ?? [];
  return SEED_ITEM_RATES.filter((r) => keys.includes(r.key));
}

export function ShipmentForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (data: NewShipment) => void;
  submitting?: boolean;
}) {
  const { data: customers, loading: customersLoading } = useCustomers();
  const { data: rateCards } = useRateCards();
  const { data: routes } = useRoutes();
  const { settings } = usePlatformSettings();

  // --- Customer & parties ---------------------------------------------------
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [sender, setSender] = useState<ContactParty>(emptyContact());
  const [receiver, setReceiver] = useState<ContactParty>(emptyContact());

  // --- Route ----------------------------------------------------------------
  // Origin can now be ANY supported country (default USA); destination is any
  // supported country other than the origin. routeCode recomputes when either
  // endpoint changes (see the memo below).
  const [originCountry, setOriginCountry] = useState(
    ORIGIN_COUNTRIES.find((c) => c === "United States") ?? ORIGIN_COUNTRIES[0] ?? "United States",
  );
  const [destinationCountry, setDestinationCountry] = useState(
    SUPPORTED_COUNTRIES.find((c) => c === "Ghana") ?? SUPPORTED_COUNTRIES[0],
  );

  // --- Pricing --------------------------------------------------------------
  const [pricingMode, setPricingMode] = useState<PricingMode>("item_based");
  const [items, setItems] = useState<ItemRow[]>([newItemRow()]);
  const [weightLb, setWeightLb] = useState("");

  // --- Misc -----------------------------------------------------------------
  const [declaredValue, setDeclaredValue] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [assignedSealOffice, setAssignedSealOffice] = useState("Minnesota Hub");

  const [error, setError] = useState<string | null>(null);

  const routeCode = useMemo(
    () => makeRouteCode(originCountry, destinationCountry),
    [originCountry, destinationCountry],
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) ?? null,
    [customers, customerId],
  );

  function handleCustomerPick(id: string) {
    setCustomerId(id);
    const customer: Customer | undefined = customers.find((c) => c.id === id);
    if (!customer) {
      setCustomerName("");
      return;
    }
    setCustomerName(customer.fullName);
    if (customer.defaultSender) {
      setSender({ ...emptyContact(), ...customer.defaultSender });
    } else {
      setSender({
        ...emptyContact(),
        name: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        country: customer.country,
        city: customer.city,
      });
    }
    if (customer.defaultReceiver) {
      setReceiver({ ...emptyContact(), ...customer.defaultReceiver });
    }
  }

  // --- Item row helpers -----------------------------------------------------
  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function changeCategory(idx: number, category: string) {
    const firstKey = ITEM_CATEGORIES[category]?.[0] ?? "";
    updateItem(idx, { category, rateKey: firstKey });
  }

  function addItem() {
    setItems((rows) => [...rows, newItemRow()]);
  }

  function removeItem(idx: number) {
    setItems((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows));
  }

  // --- Build the domain ShipmentItem[] from the rows ------------------------
  const shipmentItems: ShipmentItem[] = useMemo(() => {
    if (pricingMode !== "item_based") return [];
    return items.map((row) => {
      const rate = SEED_ITEM_RATES.find((r) => r.key === row.rateKey);
      return {
        rateKey: row.rateKey,
        category: row.category,
        itemType: rate?.label ?? row.rateKey,
        condition: rate?.condition ?? "any",
        quantity: Number(row.quantity) || 0,
        description: row.description || undefined,
      };
    });
  }, [items, pricingMode]);

  // --- Live price preview ---------------------------------------------------
  const pricing = useMemo(() => {
    const itemRateCard = selectActiveRateCard(rateCards, "item_based", routeCode, destinationCountry);
    const weightRateCard = selectActiveRateCard(rateCards, "weight_based", routeCode, destinationCountry);
    const route = routes.find((r) => r.code === routeCode) ?? null;
    return calculatePricing(
      {
        pricingMode,
        items: shipmentItems,
        weightLb: pricingMode === "weight_based" ? Number(weightLb) || 0 : undefined,
        routeCode,
        destinationCountry,
        customerId,
        customerSource: selectedCustomer?.source,
      },
      { itemRateCard, weightRateCard, route, settings },
    );
  }, [
    rateCards,
    routes,
    settings,
    pricingMode,
    shipmentItems,
    weightLb,
    routeCode,
    destinationCountry,
    customerId,
    selectedCustomer,
  ]);

  // --- Submit ---------------------------------------------------------------
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Select a customer for this shipment.");
      return;
    }
    if (!sender.name.trim()) {
      setError("Sender name is required.");
      return;
    }
    if (!receiver.name.trim()) {
      setError("Receiver name is required.");
      return;
    }
    if (pricingMode === "item_based") {
      if (shipmentItems.length === 0 || shipmentItems.some((i) => i.quantity <= 0)) {
        setError("Add at least one item with a quantity of 1 or more.");
        return;
      }
    } else if (!Number(weightLb)) {
      setError("Enter the package weight (lb).");
      return;
    }

    const data: NewShipment = {
      customerId,
      customerName,
      sender,
      receiver,
      originCountry,
      destinationCountry,
      routeCode,
      pricingMode,
      items: shipmentItems,
      weightLb: pricingMode === "weight_based" ? Number(weightLb) : undefined,
      declaredValue: declaredValue ? Number(declaredValue) : undefined,
      packageDescription: packageDescription || undefined,
      expectedDeliveryDate: expectedDeliveryDate
        ? new Date(expectedDeliveryDate).toISOString()
        : undefined,
      assignedSealOffice: assignedSealOffice || undefined,
    };
    onSubmit(data);
  }

  const currency = pricing.currency;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Customer */}
        <Card>
          <CardHeader title="Customer" subtitle="Who is shipping this package?" />
          <CardBody className="space-y-4">
            <Field label="Customer" required htmlFor="customer">
              <Select
                id="customer"
                value={customerId}
                onChange={(e) => handleCustomerPick(e.target.value)}
                disabled={customersLoading}
              >
                <option value="">
                  {customersLoading ? "Loading customers…" : "Select a customer"}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} · {c.customerCode}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Customer name" htmlFor="customerName" hint="Auto-filled from the customer record; editable.">
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
              />
            </Field>
          </CardBody>
        </Card>

        {/* Parties */}
        <Card>
          <CardHeader title="Sender & Receiver" subtitle="Pre-filled from customer defaults — editable." />
          <CardBody className="grid gap-6 sm:grid-cols-2">
            <ContactFields title="Sender" value={sender} onChange={setSender} />
            <ContactFields title="Receiver" value={receiver} onChange={setReceiver} />
          </CardBody>
        </Card>

        {/* Route */}
        <Card>
          <CardHeader title="Route" subtitle={`Route code: ${routeCode}`} />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Origin" required htmlFor="origin">
              <Select
                id="origin"
                value={originCountry}
                onChange={(e) => {
                  const next = e.target.value;
                  setOriginCountry(next);
                  // Keep destination valid (can't ship a country to itself).
                  if (next === destinationCountry) {
                    const fallback = SUPPORTED_COUNTRIES.find((c) => c !== next);
                    if (fallback) setDestinationCountry(fallback);
                  }
                }}
              >
                {ORIGIN_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Destination" required htmlFor="destination">
              <Select
                id="destination"
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
              >
                {SUPPORTED_COUNTRIES.filter((c) => c !== originCountry).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader
            title="Pricing"
            subtitle="Choose how this shipment is priced."
            action={
              <div className="inline-flex rounded-lg border border-navy-200 p-0.5">
                {(["item_based", "weight_based"] as PricingMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPricingMode(mode)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      pricingMode === mode
                        ? "bg-brand-600 text-white"
                        : "text-navy-600 hover:bg-navy-50",
                    )}
                  >
                    {PRICING_TYPE_LABELS[mode]}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody className="space-y-4">
            {pricingMode === "item_based" ? (
              <div className="space-y-3">
                {items.map((row, idx) => {
                  const rateOptions = ratesForCategory(row.category);
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 gap-3 rounded-lg border border-navy-100 bg-navy-50/40 p-3 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-3">
                        <Label htmlFor={`category-${idx}`}>Category</Label>
                        <Select
                          id={`category-${idx}`}
                          value={row.category}
                          onChange={(e) => changeCategory(idx, e.target.value)}
                        >
                          {ITEM_CATEGORY_KEYS.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="sm:col-span-4">
                        <Label htmlFor={`item-${idx}`}>Item</Label>
                        <Select
                          id={`item-${idx}`}
                          value={row.rateKey}
                          onChange={(e) => updateItem(idx, { rateKey: e.target.value })}
                        >
                          {rateOptions.map((rate) => (
                            <option key={rate.key} value={rate.key}>
                              {rate.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor={`qty-${idx}`}>Qty</Label>
                        <Input
                          id={`qty-${idx}`}
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Label htmlFor={`desc-${idx}`}>Notes</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`desc-${idx}`}
                            value={row.description}
                            onChange={(e) => updateItem(idx, { description: e.target.value })}
                            placeholder="Optional"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4" /> Add item
                </Button>
              </div>
            ) : (
              <Field label="Package weight (lb)" required htmlFor="weight" hint="Used with the active per-pound rate for this route.">
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  step="0.01"
                  value={weightLb}
                  onChange={(e) => setWeightLb(e.target.value)}
                  placeholder="0.00"
                />
              </Field>
            )}
          </CardBody>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader title="Package details" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Declared value" htmlFor="declaredValue">
              <Input
                id="declaredValue"
                type="number"
                min={0}
                step="0.01"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Expected delivery date" htmlFor="eta">
              <Input
                id="eta"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </Field>
            <Field label="Assigned operations hub" htmlFor="sealOffice">
              <Input
                id="sealOffice"
                value={assignedSealOffice}
                onChange={(e) => setAssignedSealOffice(e.target.value)}
                placeholder="Minnesota Hub"
              />
            </Field>
            <Field label="Package description" htmlFor="packageDescription" className="sm:col-span-2">
              <Textarea
                id="packageDescription"
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                placeholder="Brief description of the package contents"
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      {/* Live price preview */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-4 space-y-4">
          <Card>
            <CardHeader title="Price preview" subtitle={pricing.rateCardName} />
            <CardBody className="space-y-4">
              {pricing.lines.length === 0 ? (
                <p className="text-sm text-navy-400">Add items or a weight to preview pricing.</p>
              ) : (
                <ul className="space-y-2">
                  {pricing.lines.map((line, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-navy-600">{line.description}</span>
                      <span className="shrink-0 font-medium text-navy-900">
                        {formatMoney(line.amount, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-1.5 border-t border-navy-100 pt-3 text-sm">
                <div className="flex justify-between text-navy-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(pricing.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-navy-600">
                  <span>Service fee</span>
                  <span>{formatMoney(pricing.serviceFee, currency)}</span>
                </div>
                <div className="flex justify-between border-t border-navy-100 pt-2 text-base font-semibold text-navy-900">
                  <span>Total</span>
                  <span>{formatMoney(pricing.total, currency)}</span>
                </div>
              </div>

              {pricing.warnings.length > 0 && (
                <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  {pricing.warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-xs text-navy-400">
                Indicative only — the binding invoice is generated from the active rate card.
              </p>
            </CardBody>
          </Card>

          {error && (
            <InfoBanner tone="warning">{error}</InfoBanner>
          )}

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Create shipment
          </Button>
        </div>
      </div>
    </form>
  );
}

function ContactFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: ContactParty;
  onChange: (v: ContactParty) => void;
}) {
  function set(patch: Partial<ContactParty>) {
    onChange({ ...value, ...patch });
  }
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{title}</p>
      <Field label="Name" required>
        <Input value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="Full name" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <Input value={value.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} placeholder="Phone" />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={value.email ?? ""}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="Email"
          />
        </Field>
      </div>
      <Field label="Address">
        <Input value={value.address ?? ""} onChange={(e) => set({ address: e.target.value })} placeholder="Address" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City">
          <Input value={value.city ?? ""} onChange={(e) => set({ city: e.target.value })} placeholder="City" />
        </Field>
        <Field label="Country">
          <Input value={value.country ?? ""} onChange={(e) => set({ country: e.target.value })} placeholder="Country" />
        </Field>
      </div>
    </div>
  );
}
