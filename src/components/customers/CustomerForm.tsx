"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Upload, FileCheck2 } from "lucide-react";
import { Button, Field, Input, Select, Textarea, useToast } from "@/components/ui";
import { NotificationPreferencesField } from "@/components/customers/NotificationPreferencesField";
import { uploadFile } from "@/lib/firebase/storage";
import { PILOT_COUNTRIES } from "@/constants/seed-data";
import { CUSTOMER_TYPE_LABELS, CUSTOMER_SOURCE_LABELS } from "@/constants/statuses";
import type {
  Customer,
  ContactParty,
  CustomerType,
  CustomerSource,
} from "@/types";
import type { NewCustomer } from "@/lib/db/repositories/customers";

const ID_TYPES: { value: NonNullable<NonNullable<Customer["idVerification"]>["type"]>; label: string }[] = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID" },
  { value: "other", label: "Other" },
];

/** Local mutable shape used by the controlled inputs. */
interface FormState {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address: string;
  customerType: CustomerType;
  source: CustomerSource;
  referredBy: string;
  notes: string;
  idType: string;
  idNumber: string;
  idDocumentUrl: string;
  idVerified: boolean;
  sender: ContactParty;
  receiver: ContactParty;
  active: boolean;
  notifications: { email: boolean; sms: boolean; whatsapp: boolean };
}

function emptyParty(): ContactParty {
  return { name: "", phone: "", email: "", address: "", country: "" };
}

function stateFromInitial(initial?: Partial<Customer>): FormState {
  return {
    fullName: initial?.fullName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    country: initial?.country ?? PILOT_COUNTRIES[0],
    city: initial?.city ?? "",
    address: initial?.address ?? "",
    customerType: initial?.customerType ?? "individual",
    source: initial?.source ?? "liberty",
    referredBy: initial?.referredBy ?? "",
    notes: initial?.notes ?? "",
    idType: initial?.idVerification?.type ?? "",
    idNumber: initial?.idVerification?.number ?? "",
    idDocumentUrl: initial?.idVerification?.documentUrl ?? "",
    idVerified: initial?.idVerification?.verified ?? false,
    sender: { ...emptyParty(), ...(initial?.defaultSender ?? {}) },
    receiver: { ...emptyParty(), ...(initial?.defaultReceiver ?? {}) },
    active: initial?.active ?? true,
    notifications: initial?.notificationPreferences ?? { email: true, sms: true, whatsapp: false },
  };
}

/** Strip empty strings from a ContactParty; return undefined if it has no name. */
function cleanParty(p: ContactParty): ContactParty | undefined {
  const name = p.name.trim();
  if (!name) return undefined;
  const out: ContactParty = { name };
  if (p.phone?.trim()) out.phone = p.phone.trim();
  if (p.email?.trim()) out.email = p.email.trim();
  if (p.address?.trim()) out.address = p.address.trim();
  if (p.country?.trim()) out.country = p.country.trim();
  return out;
}

export function CustomerForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<Customer>;
  onSubmit: (data: NewCustomer) => void | Promise<void>;
  submitting?: boolean;
}) {
  const { error: toastError } = useToast();
  const [form, setForm] = useState<FormState>(() => stateFromInitial(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setParty = (which: "sender" | "receiver", key: keyof ContactParty, value: string) =>
    setForm((f) => ({ ...f, [which]: { ...f[which], [key]: value } }));

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadFile("customers/tmp", file);
      set("idDocumentUrl", url);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!form.country.trim()) next.country = "Country is required.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || uploading) return;
    if (!validate()) return;

    const hasIdVerification =
      Boolean(form.idType) || Boolean(form.idNumber.trim()) || Boolean(form.idDocumentUrl);

    const data: NewCustomer = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      country: form.country.trim(),
      city: form.city.trim() || undefined,
      address: form.address.trim() || undefined,
      customerType: form.customerType,
      source: form.source,
      referredBy: form.referredBy.trim() || undefined,
      notes: form.notes.trim() || undefined,
      defaultSender: cleanParty(form.sender),
      defaultReceiver: cleanParty(form.receiver),
      idVerification: hasIdVerification
        ? {
            type: (form.idType || undefined) as NonNullable<Customer["idVerification"]>["type"],
            number: form.idNumber.trim() || undefined,
            documentUrl: form.idDocumentUrl || undefined,
            verified: form.idVerified,
          }
        : undefined,
      notificationPreferences: form.notifications,
      active: form.active,
    };

    void onSubmit(data);
  }

  const disabled = Boolean(submitting) || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identity & contact ------------------------------------------------ */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-navy-900">Contact details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required htmlFor="fullName" error={errors.fullName}>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="e.g. Kwame Mensah"
              autoComplete="off"
            />
          </Field>
          <Field label="Phone" required htmlFor="phone" error={errors.phone}>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 555 000 0000"
              autoComplete="off"
            />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@email.com"
              autoComplete="off"
            />
          </Field>
          <Field label="Country" required htmlFor="country" error={errors.country}>
            <Select id="country" value={form.country} onChange={(e) => set("country", e.target.value)}>
              {PILOT_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="City" htmlFor="city">
            <Input
              id="city"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="e.g. Accra"
            />
          </Field>
          <Field label="Address" htmlFor="address">
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, area"
            />
          </Field>
        </div>
      </section>

      {/* Classification ---------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-navy-900">Classification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer type" htmlFor="customerType">
            <Select
              id="customerType"
              value={form.customerType}
              onChange={(e) => set("customerType", e.target.value as CustomerType)}
            >
              {(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map((t) => (
                <option key={t} value={t}>
                  {CUSTOMER_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source" htmlFor="source">
            <Select
              id="source"
              value={form.source}
              onChange={(e) => set("source", e.target.value as CustomerSource)}
            >
              {(Object.keys(CUSTOMER_SOURCE_LABELS) as CustomerSource[]).map((s) => (
                <option key={s} value={s}>
                  {CUSTOMER_SOURCE_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Referred by" htmlFor="referredBy" hint="Name of referrer, if any">
            <Input
              id="referredBy"
              value={form.referredBy}
              onChange={(e) => set("referredBy", e.target.value)}
              placeholder="Referrer name"
            />
          </Field>
        </div>
        <Field label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Internal notes about this customer…"
          />
        </Field>
        <Field label="Notification channels" hint="Which channels this customer receives updates on.">
          <NotificationPreferencesField
            value={form.notifications}
            onChange={(v) => set("notifications", v)}
          />
        </Field>
      </section>

      {/* ID verification --------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-navy-900">ID verification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ID type" htmlFor="idType">
            <Select id="idType" value={form.idType} onChange={(e) => set("idType", e.target.value)}>
              <option value="">None</option>
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="ID number" htmlFor="idNumber">
            <Input
              id="idNumber"
              value={form.idNumber}
              onChange={(e) => set("idNumber", e.target.value)}
              placeholder="Document number"
            />
          </Field>
        </div>
        <Field label="ID document" hint="Optional — upload a scan or photo of the ID">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {form.idDocumentUrl ? "Replace document" : "Upload document"}
            </Button>
            {form.idDocumentUrl && (
              <a
                href={form.idDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
              >
                <FileCheck2 className="h-4 w-4" /> View uploaded document
              </a>
            )}
          </div>
        </Field>
      </section>

      {/* Default sender / receiver ---------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-navy-900">Default contacts</h3>
        <p className="-mt-2 text-xs text-navy-400">
          Pre-filled when creating shipments for this customer.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <PartyFields
            legend="Default sender"
            party={form.sender}
            onChange={(key, value) => setParty("sender", key, value)}
            idPrefix="sender"
          />
          <PartyFields
            legend="Default receiver"
            party={form.receiver}
            onChange={(key, value) => setParty("receiver", key, value)}
            idPrefix="receiver"
          />
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
        <Button type="submit" loading={submitting} disabled={disabled}>
          {initial?.id ? "Save changes" : "Create customer"}
        </Button>
      </div>
    </form>
  );
}

function PartyFields({
  legend,
  party,
  onChange,
  idPrefix,
}: {
  legend: string;
  party: ContactParty;
  onChange: (key: keyof ContactParty, value: string) => void;
  idPrefix: string;
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-navy-100 bg-navy-50/40 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-navy-500">
        {legend}
      </legend>
      <Field label="Name" htmlFor={`${idPrefix}-name`}>
        <Input
          id={`${idPrefix}-name`}
          value={party.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Contact name"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phone" htmlFor={`${idPrefix}-phone`}>
          <Input
            id={`${idPrefix}-phone`}
            value={party.phone ?? ""}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="Phone"
          />
        </Field>
        <Field label="Email" htmlFor={`${idPrefix}-email`}>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={party.email ?? ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="Email"
          />
        </Field>
      </div>
      <Field label="Address" htmlFor={`${idPrefix}-address`}>
        <Input
          id={`${idPrefix}-address`}
          value={party.address ?? ""}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Address"
        />
      </Field>
      <Field label="Country" htmlFor={`${idPrefix}-country`}>
        <Select
          id={`${idPrefix}-country`}
          value={party.country ?? ""}
          onChange={(e) => onChange("country", e.target.value)}
        >
          <option value="">Select country</option>
          {PILOT_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
    </fieldset>
  );
}
