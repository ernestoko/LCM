"use client";

import { StatusBadge } from "@/components/ui";
import { Eagle } from "@/components/brand/Eagle";
import { BUSINESS } from "@/constants/business";
import { PAYMENT_STATUS_META } from "@/constants/statuses";
import { formatMoney, formatWeight } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import type { Shipment, ContactParty } from "@/types";

export interface WaybillProps {
  shipment: Shipment;
}

/**
 * Full-page shipment Waybill (consignment note) — one per shipment. Travels
 * with the consignment and is distinct from the per-box PackageLabel.
 */
export function Waybill({ shipment }: WaybillProps) {
  const pieces = shipment.pieces ?? 1;
  const totalDeclared =
    shipment.items?.reduce((sum, it) => sum + (it.declaredValue ?? 0) * (it.quantity ?? 1), 0) ||
    shipment.declaredValue ||
    0;

  return (
    <div className="print-container rounded-xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
      {/* Brand accent stripe */}
      <div
        className="-mx-6 -mt-6 mb-6 h-1.5 rounded-t-xl bg-gradient-to-r from-brand-600 via-brand-500 to-gold-400 sm:-mx-8 sm:-mt-8"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-navy-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Eagle className="h-12 w-12 shrink-0" fill="#b8860b" eyeFill="#ffffff" />
          <div>
            <h1 className="text-xl font-extrabold italic tracking-tight text-navy-900">{BUSINESS.name}</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-600">{BUSINESS.tagline}</p>
            <div className="mt-2 space-y-0.5 text-xs leading-relaxed text-navy-500">
              <p>{BUSINESS.addresses.usa}</p>
              <p>{BUSINESS.phone} · {BUSINESS.email}</p>
            </div>
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-2xl font-extrabold uppercase tracking-tight text-navy-900">Waybill</p>
          <p className="font-mono text-base font-semibold text-brand-700">{shipment.trackingNumber}</p>
          <p className="mt-1 text-sm text-navy-500">Issued {formatDate(shipment.createdAt)}</p>
          <div className="mt-2 flex sm:justify-end">
            <StatusBadge meta={PAYMENT_STATUS_META[shipment.paymentStatus]} fallback={shipment.paymentStatus} />
          </div>
        </div>
      </div>

      {/* Shipper / Consignee */}
      <div className="grid gap-6 border-b border-navy-100 py-6 sm:grid-cols-2">
        <PartyBlock title="Shipper (From)" party={shipment.sender} fallbackCountry={shipment.originCountry} />
        <PartyBlock title="Consignee (To)" party={shipment.receiver} fallbackCountry={shipment.destinationCountry} />
      </div>

      {/* Shipment details */}
      <div className="grid gap-x-8 gap-y-4 border-b border-navy-100 py-6 sm:grid-cols-3">
        <Field label="Route" value={shipment.routeCode} mono />
        <Field label="Origin → Destination" value={`${shipment.originCountry} → ${shipment.destinationCountry}`} />
        <Field label="Operations hub" value={shipment.assignedSealOffice ?? "—"} />
        <Field label="Packages" value={`${pieces} ${pieces === 1 ? "piece" : "pieces"}`} />
        <Field label="Total weight" value={formatWeight(shipment.weightLb)} />
        <Field label="Declared value" value={formatMoney(totalDeclared)} />
        <Field label="Expected delivery" value={formatDate(shipment.expectedDeliveryDate)} />
        <Field label="Created" value={formatDate(shipment.createdAt)} />
        <Field label="Tracking" value={shipment.trackingNumber} mono />
      </div>

      {/* Contents */}
      <div className="py-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">Description of goods</p>
        {shipment.items && shipment.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="border-y border-navy-100 text-left text-xs uppercase tracking-wide text-navy-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Item</th>
                  <th className="px-3 py-2.5 font-medium">Condition</th>
                  <th className="px-3 py-2.5 text-right font-medium">Qty</th>
                  <th className="px-3 py-2.5 text-right font-medium">Declared value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {shipment.items.map((it, i) => (
                  <tr key={i}>
                    <td className="px-3 py-3 text-navy-800">{it.itemType || it.category}</td>
                    <td className="px-3 py-3 capitalize text-navy-600">{it.condition}</td>
                    <td className="px-3 py-3 text-right text-navy-700">{it.quantity}</td>
                    <td className="px-3 py-3 text-right text-navy-700">{formatMoney(it.declaredValue ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-navy-800">{shipment.packageDescription || "General cargo"}</p>
        )}
      </div>

      {/* Handling note */}
      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        Goods accepted subject to our standard terms of carriage. The shipper warrants the contents
        and declared value above are accurate and the consignment contains no prohibited items.
      </div>

      {/* Signatures */}
      <div className="mt-8 grid gap-8 sm:grid-cols-3">
        <Signature title="Shipped by" />
        <Signature title="Received by (carrier)" />
        <Signature title="Delivered to (consignee)" />
      </div>

      <div className="mt-6 border-t border-navy-100 pt-4 text-center text-xs text-navy-400">
        {BUSINESS.name} · {BUSINESS.website} — this is a computer-generated waybill.
      </div>
    </div>
  );
}

function PartyBlock({
  title,
  party,
  fallbackCountry,
}: {
  title: string;
  party: ContactParty;
  fallbackCountry?: string;
}) {
  const location = [party.city, party.country ?? fallbackCountry].filter(Boolean).join(", ");
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{title}</p>
      <p className="mt-1 text-base font-bold text-navy-900">{party.name || "—"}</p>
      {party.address && <p className="text-sm text-navy-600">{party.address}</p>}
      {location && <p className="text-sm text-navy-600">{location}</p>}
      {party.phone && <p className="text-sm text-navy-600">{party.phone}</p>}
      {party.email && <p className="text-sm text-navy-600">{party.email}</p>}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className={`mt-0.5 text-sm text-navy-800${mono ? " font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

function Signature({ title }: { title: string }) {
  return (
    <div>
      <div className="h-12 border-b border-navy-300" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-navy-500">{title}</p>
      <p className="mt-3 text-xs text-navy-400">Name / Signature</p>
      <div className="mt-4 h-px w-2/3 bg-navy-200" />
      <p className="mt-1 text-xs text-navy-400">Date</p>
    </div>
  );
}
