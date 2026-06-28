"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Warehouse, Copy, Check, PackagePlus, ArrowRight } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { useDocument } from "@/lib/db/hooks";
import { COLLECTIONS } from "@/lib/db/collections";
import { createRequest } from "@/lib/db/repositories/requests";
import { CargoTypeChoice } from "@/components/shipments/CargoTypeChoice";
import { WAREHOUSES, getWarehouse, warehouseAddressLines } from "@/constants/warehouses";
import {
  PageHeader,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Textarea,
  Button,
  InfoBanner,
  EmptyState,
  useToast,
} from "@/components/ui";
import type { Customer, CargoType } from "@/types";

export default function ShipToWarehousePage() {
  return (
    <RequirePermission permission="requests.create">
      <WarehousePortal />
    </RequirePermission>
  );
}

function WarehousePortal() {
  const { user } = useAuth();
  const actor = useActor();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const customerId = user?.customerId;
  const { data: customer } = useDocument<Customer>(COLLECTIONS.customers, customerId ?? "");

  const customerName = customer?.fullName ?? user?.displayName ?? "Your name";
  const customerCode = customer?.customerCode;

  const [hubKey, setHubKey] = useState(
    WAREHOUSES.find((w) => w.primary)?.key ?? WAREHOUSES[0].key,
  );
  const hub = getWarehouse(hubKey) ?? WAREHOUSES[0];

  const [cargoType, setCargoType] = useState<CargoType>("air");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [expected, setExpected] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const addressLines = warehouseAddressLines(hub, customerName, customerCode);

  if (!customerId) {
    return (
      <div>
        <PageHeader title="Ship to our Warehouse" />
        <EmptyState
          icon={Warehouse}
          title="No customer profile linked"
          description="Your account isn't linked to a customer record yet. Please contact support."
        />
      </div>
    );
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(addressLines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toastError("Couldn't copy — please copy the address manually.");
    }
  }

  const canSubmit = Boolean(customerId) && description.trim() !== "" && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const { requestNumber } = await createRequest(
        {
          type: "ship_to_warehouse",
          customerId: customerId!,
          customerName,
          customerPhone: customer?.phone ?? user?.phone ?? undefined,
          customerEmail: user?.email ?? undefined,
          cargoType,
          packageDescription: description.trim(),
          declaredValue: value ? Number.parseFloat(value) : undefined,
          destinationCountry: customer?.country,
          inbound: {
            warehouse: hub.key,
            carrier: carrier.trim() || undefined,
            carrierTracking: tracking.trim() || undefined,
            expectedArrival: expected || undefined,
          },
        },
        actor,
      );
      success(`Package pre-alert ${requestNumber} created. We'll notify you the moment it arrives.`);
      router.push("/requests");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not save your pre-alert. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Ship to our Warehouse"
        description="Shopping online? Send your purchases to your personal Liberty address and we'll forward them to you."
      />

      <div className="space-y-5">
        {/* Hub picker — pick the city closest to where you shop */}
        <div>
          <p className="mb-2 text-sm font-medium text-navy-600">
            Choose the hub closest to where you shop ({WAREHOUSES.length} locations)
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {WAREHOUSES.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => setHubKey(w.key)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  hubKey === w.key
                    ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200"
                    : "border-navy-100 bg-white hover:border-navy-200"
                }`}
              >
                <span className="text-lg">{w.flag}</span>
                <p className="mt-1 text-sm font-semibold text-navy-900">{w.name}</p>
                <p className="text-[11px] text-navy-500">
                  {w.city}, {w.region}
                </p>
                {w.primary ? (
                  <p className="mt-0.5 text-[11px] font-medium text-brand-600">Recommended</p>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Your address */}
        <Card>
          <CardBody>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Your {hub.name} address</p>
                <address className="mt-2 not-italic text-[15px] leading-relaxed text-navy-900">
                  {addressLines.map((line, i) => (
                    <span key={i} className={i === 2 ? "block font-bold text-brand-700" : "block"}>
                      {line}
                    </span>
                  ))}
                </address>
                <p className="mt-2 text-xs text-navy-500">Tel: {hub.phone}</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyAddress}>
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <InfoBanner tone="warning" className="mt-4">
              Always include <strong>your suite line ({customerCode ?? "your customer code"})</strong> so we can match the
              parcel to you the moment it lands.
            </InfoBanner>
          </CardBody>
        </Card>

        {/* Pre-alert */}
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <PackagePlus className="h-4 w-4" />
              </span>
              Pre-alert a package on its way
            </div>
            <p className="text-sm text-navy-500">
              Optional, but it helps us receive and forward your parcel faster.
            </p>
            <Field label="Shipping method" hint="How would you like us to forward it? Air is fastest; sea is best value for bulky cargo.">
              <CargoTypeChoice value={cargoType} onChange={setCargoType} />
            </Field>
            <Field label="Package description" required htmlFor="wh-desc" hint="What did you order?">
              <Textarea id="wh-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Apple AirPods Pro + 2 pairs of shoes" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Carrier" htmlFor="wh-carrier" hint="Who's delivering it to us?">
                <Input id="wh-carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="UPS, USPS, Amazon…" />
              </Field>
              <Field label="Carrier tracking #" htmlFor="wh-track">
                <Input id="wh-track" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="1Z…" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Expected arrival" htmlFor="wh-eta" hint="Optional">
                <Input id="wh-eta" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
              </Field>
              <Field label="Declared value (USD)" htmlFor="wh-val" hint="Optional">
                <Input id="wh-val" type="number" min={0} step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" />
              </Field>
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={!canSubmit} size="lg">
            Create pre-alert
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
