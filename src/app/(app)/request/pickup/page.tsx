"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, PackageCheck, MapPin, ArrowRight } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { createRequest } from "@/lib/db/repositories/requests";
import { CargoTypeChoice } from "@/components/shipments/CargoTypeChoice";
import { SUPPORTED_COUNTRIES } from "@/constants/seed-data";
import type { CargoType } from "@/types";
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

export default function RequestPickupPage() {
  return (
    <RequirePermission permission="requests.create">
      <PickupForm />
    </RequirePermission>
  );
}

function PickupForm() {
  const { user } = useAuth();
  const actor = useActor();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const customerId = user?.customerId;

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("United States");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredWindow, setPreferredWindow] = useState<"morning" | "afternoon" | "evening">("morning");

  const [cargoType, setCargoType] = useState<CargoType>("air");
  const [description, setDescription] = useState("");
  const [pieces, setPieces] = useState("1");
  const [weight, setWeight] = useState("");
  const [destination, setDestination] = useState("Ghana");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const canSubmit =
    Boolean(customerId) && address.trim() !== "" && description.trim() !== "" && !saving;

  if (!customerId) {
    return (
      <div>
        <PageHeader title="Request a Pickup" />
        <EmptyState
          icon={Truck}
          title="No customer profile linked"
          description="Your account isn't linked to a customer record yet. Please contact support."
        />
      </div>
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const { requestNumber } = await createRequest(
        {
          type: "pickup",
          customerId: customerId!,
          customerName: user?.displayName ?? "Customer",
          customerPhone: phone.trim() || undefined,
          customerEmail: user?.email ?? undefined,
          cargoType,
          packageDescription: description.trim(),
          pieces: Number.parseInt(pieces, 10) || 1,
          approxWeightLb: weight ? Number.parseFloat(weight) : undefined,
          destinationCountry: destination,
          receiver: receiverName.trim()
            ? { name: receiverName.trim(), phone: receiverPhone.trim() || undefined, country: destination }
            : undefined,
          pickup: {
            address: address.trim(),
            city: city.trim() || undefined,
            country,
            contactPhone: phone.trim() || undefined,
            preferredDate: preferredDate || undefined,
            preferredWindow,
          },
          notes: notes.trim() || undefined,
        },
        actor,
      );
      success(`Pickup request ${requestNumber} submitted. We'll be in touch to confirm.`);
      router.push("/requests");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not submit your request. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Request a Pickup"
        description="Tell us where to collect your package — we'll come to you and handle the rest."
      />

      <div className="space-y-5">
        {/* Where to collect */}
        <Card>
          <CardBody className="space-y-4">
            <SectionTitle icon={<MapPin className="h-4 w-4" />} title="Where should we collect?" />
            <Field label="Pickup address" required htmlFor="pk-addr">
              <Input
                id="pk-addr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, building, apartment…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" htmlFor="pk-city">
                <Input id="pk-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </Field>
              <Field label="Country" htmlFor="pk-country">
                <Select id="pk-country" value={country} onChange={(e) => setCountry(e.target.value)}>
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Contact phone" htmlFor="pk-phone">
                <Input id="pk-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preferred date" htmlFor="pk-date" hint="We'll confirm the exact time.">
                <Input id="pk-date" type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
              </Field>
              <Field label="Preferred time" htmlFor="pk-window">
                <Select id="pk-window" value={preferredWindow} onChange={(e) => setPreferredWindow(e.target.value as typeof preferredWindow)}>
                  <option value="morning">Morning (8am–12pm)</option>
                  <option value="afternoon">Afternoon (12pm–5pm)</option>
                  <option value="evening">Evening (5pm–8pm)</option>
                </Select>
              </Field>
            </div>
          </CardBody>
        </Card>

        {/* What & where to */}
        <Card>
          <CardBody className="space-y-4">
            <SectionTitle icon={<PackageCheck className="h-4 w-4" />} title="What are we shipping?" />
            <Field label="Shipping method" hint="Air is fastest; sea is best value for bulky cargo.">
              <CargoTypeChoice value={cargoType} onChange={setCargoType} />
            </Field>
            <Field label="Package description" required htmlFor="pk-desc" hint="What's inside? e.g. 2 cartons of clothing and a laptop.">
              <Textarea id="pk-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the contents…" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Pieces" htmlFor="pk-pieces">
                <Input id="pk-pieces" type="number" min={1} value={pieces} onChange={(e) => setPieces(e.target.value)} />
              </Field>
              <Field label="Approx. weight (lb)" htmlFor="pk-weight" hint="Optional">
                <Input id="pk-weight" type="number" min={0} step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Destination country" htmlFor="pk-dest">
                <Select id="pk-dest" value={destination} onChange={(e) => setDestination(e.target.value)}>
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Recipient name" htmlFor="pk-rname" hint="Optional — who receives it?">
                <Input id="pk-rname" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Recipient full name" />
              </Field>
              <Field label="Recipient phone" htmlFor="pk-rphone" hint="Optional">
                <Input id="pk-rphone" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="Recipient phone" />
              </Field>
            </div>
            <Field label="Anything else?" htmlFor="pk-notes">
              <Textarea id="pk-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions, gate codes, fragile items…" />
            </Field>
          </CardBody>
        </Card>

        <InfoBanner tone="info">
          No payment now. We'll review your request, confirm the pickup, then send a clear quote before anything ships.
        </InfoBanner>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={!canSubmit} size="lg">
            Submit pickup request
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      {title}
    </div>
  );
}
