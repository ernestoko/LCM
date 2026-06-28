"use client";

import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  Field,
  Input,
  Select,
  Checkbox,
  EmptyState,
  useToast,
} from "@/components/ui";
import { SUPPORTED_COUNTRIES } from "@/constants/seed-data";
import type { CustomerAddress } from "@/types";

function genId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `addr_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  }
}

function emptyAddress(): CustomerAddress {
  return {
    id: "",
    label: "",
    contactName: "",
    phone: "",
    line1: "",
    city: "",
    region: "",
    postal: "",
    country: "Ghana",
    isDefault: false,
  };
}

/** Manage a customer's saved addresses (multiple delivery / pickup locations). */
export function AddressBook({
  addresses,
  onSave,
  editable = true,
  title = "Addresses",
  subtitle,
}: {
  addresses: CustomerAddress[];
  onSave: (next: CustomerAddress[]) => Promise<void> | void;
  editable?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const { success, error } = useToast();
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [busy, setBusy] = useState(false);

  async function persist(next: CustomerAddress[]) {
    setBusy(true);
    try {
      await onSave(next);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveOne(addr: CustomerAddress) {
    if (!addr.label.trim() || !addr.line1.trim()) {
      error("A label and an address line are required.");
      return;
    }
    const id = addr.id || genId();
    const withId: CustomerAddress = { ...addr, id };
    let next = addr.id
      ? addresses.map((a) => (a.id === id ? withId : a))
      : [...addresses, withId];
    // Exactly one default; first address is default by, well, default.
    if (withId.isDefault || next.length === 1) {
      next = next.map((a) => ({ ...a, isDefault: a.id === id }));
    }
    try {
      await persist(next);
      success("Address saved.");
      setEditing(null);
    } catch (e) {
      error(e instanceof Error ? e.message : "Couldn't save the address.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await persist(addresses.filter((a) => a.id !== id));
      success("Address removed.");
    } catch (e) {
      error(e instanceof Error ? e.message : "Couldn't remove the address.");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await persist(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch (e) {
      error(e instanceof Error ? e.message : "Couldn't update the default.");
    }
  }

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          editable ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(emptyAddress())}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          ) : undefined
        }
      />
      <CardBody className="space-y-3">
        {addresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No addresses yet"
            description={editable ? "Add a delivery or pickup address." : "No addresses on file."}
            action={
              editable ? (
                <Button size="sm" onClick={() => setEditing(emptyAddress())}>
                  <Plus className="h-4 w-4" /> Add address
                </Button>
              ) : undefined
            }
          />
        ) : (
          addresses.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-navy-100 p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-navy-900">{a.label}</p>
                  {a.isDefault && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-navy-600">
                  {[a.line1, a.city, a.region, a.postal, a.country].filter(Boolean).join(", ")}
                </p>
                {(a.contactName || a.phone) && (
                  <p className="text-xs text-navy-400">
                    {[a.contactName, a.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              {editable && (
                <div className="flex shrink-0 items-center gap-1">
                  {!a.isDefault && (
                    <Button size="icon" variant="ghost" onClick={() => handleSetDefault(a.id)} aria-label="Set as default">
                      <Star className="h-4 w-4 text-navy-400" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => setEditing(a)} aria-label="Edit address">
                    <Pencil className="h-4 w-4 text-navy-500" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)} aria-label="Remove address">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardBody>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit address" : "Add address"}
        footer={
          editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={() => editing && handleSaveOne(editing)} loading={busy}>
                Save address
              </Button>
            </>
          ) : undefined
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Label" required>
                <Input
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  placeholder="Home, Office, Accra shop…"
                />
              </Field>
              <Field label="Country" required>
                <Select
                  value={editing.country}
                  onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Address line" required>
              <Input
                value={editing.line1}
                onChange={(e) => setEditing({ ...editing, line1: e.target.value })}
                placeholder="Street, building, apartment"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City">
                <Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </Field>
              <Field label="Region / State">
                <Input value={editing.region ?? ""} onChange={(e) => setEditing({ ...editing, region: e.target.value })} />
              </Field>
              <Field label="Postal code">
                <Input value={editing.postal ?? ""} onChange={(e) => setEditing({ ...editing, postal: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact name">
                <Input
                  value={editing.contactName ?? ""}
                  onChange={(e) => setEditing({ ...editing, contactName: e.target.value })}
                  placeholder="Recipient at this address"
                />
              </Field>
              <Field label="Phone">
                <Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </Field>
            </div>
            <Checkbox
              checked={editing.isDefault ?? false}
              onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
              label="Set as the default address"
            />
          </div>
        )}
      </Modal>
    </Card>
  );
}
