"use client";

import { StatusBadge } from "@/components/ui";
import { PAYMENT_STATUS_META } from "@/constants/statuses";
import { formatMoney, formatWeight } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import type { Shipment, ContactParty } from "@/types";
import { Barcode } from "./Barcode";

export interface WaybillProps {
  shipment: Shipment;
}

/**
 * Printable 4×6 shipping label (waybill) for SEAL staff to affix to packages.
 * Sized at 4in × 6in; the `.print-container` class strips card chrome at print.
 */
export function Waybill({ shipment }: WaybillProps) {
  const description =
    shipment.packageDescription?.trim() ||
    shipment.items
      .map((item) =>
        item.quantity > 1 ? `${item.quantity}× ${item.itemType}` : item.itemType,
      )
      .filter(Boolean)
      .join(", ") ||
    "General cargo";

  return (
    <div
      className="print-container bg-white text-navy-900"
      style={{
        width: "4in",
        height: "6in",
        boxSizing: "border-box",
        border: "1.5px solid #0f172a",
        borderRadius: 6,
        padding: "0.18in",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontSize: 11,
        lineHeight: 1.25,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1.5px solid #0f172a",
          paddingBottom: 6,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.01em" }}>
            Liberty Cargo Movers
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#475569",
            }}
          >
            LCM Logistics — Pilot
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 8,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#64748b",
            }}
          >
            Route
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
            {shipment.routeCode || "—"}
          </div>
        </div>
      </div>

      {/* Barcode */}
      <div style={{ padding: "8px 0 4px", textAlign: "center" }}>
        <Barcode value={shipment.trackingNumber} height={72} />
      </div>

      {/* FROM / TO */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderTop: "1px solid #cbd5e1",
          borderBottom: "1px solid #cbd5e1",
          padding: "6px 0",
        }}
      >
        <PartyBlock label="From (Sender)" party={shipment.sender} fallbackCountry={shipment.originCountry} />
        <div style={{ width: 1, background: "#cbd5e1" }} />
        <PartyBlock label="To (Receiver)" party={shipment.receiver} fallbackCountry={shipment.destinationCountry} />
      </div>

      {/* Route line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 0 4px",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        <span>
          {shipment.originCountry || "—"} <span style={{ color: "#94a3b8" }}>→</span>{" "}
          {shipment.destinationCountry || "—"}
        </span>
        <StatusBadge meta={PAYMENT_STATUS_META[shipment.paymentStatus]} />
      </div>

      {/* Metrics grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 10px",
          padding: "4px 0",
          borderTop: "1px solid #cbd5e1",
        }}
      >
        <Metric label="Weight" value={formatWeight(shipment.weightLb)} />
        <Metric label="Declared value" value={formatMoney(shipment.declaredValue ?? 0)} />
        <Metric label="Created" value={formatDate(shipment.createdAt)} />
        <Metric label="Operations hub" value={shipment.assignedSealOffice || "Unassigned"} />
      </div>

      {/* Package description */}
      <div style={{ padding: "4px 0", borderTop: "1px solid #cbd5e1" }}>
        <FieldLabel>Package contents</FieldLabel>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {description}
        </div>
      </div>

      {/* Footer — customer + tracking restated */}
      <div
        style={{
          marginTop: "auto",
          borderTop: "1.5px solid #0f172a",
          paddingTop: 6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <FieldLabel>Customer</FieldLabel>
          <div style={{ fontSize: 11, fontWeight: 600 }}>{shipment.customerName}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <FieldLabel>Tracking</FieldLabel>
          <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800 }}>
            {shipment.trackingNumber}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyBlock({
  label,
  party,
  fallbackCountry,
}: {
  label: string;
  party: ContactParty;
  fallbackCountry?: string;
}) {
  const locationParts = [party.city, party.country ?? fallbackCountry].filter(Boolean);
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
        {party.name || "—"}
      </div>
      {party.address && (
        <div style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.2 }}>{party.address}</div>
      )}
      {locationParts.length > 0 && (
        <div style={{ fontSize: 9.5, color: "#475569" }}>{locationParts.join(", ")}</div>
      )}
      {party.phone && <div style={{ fontSize: 9.5, color: "#475569" }}>{party.phone}</div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ fontSize: 11, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 8,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#64748b",
      }}
    >
      {children}
    </div>
  );
}
