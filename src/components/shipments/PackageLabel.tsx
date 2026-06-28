"use client";

import { QRCodeSVG } from "qrcode.react";
import { StatusBadge } from "@/components/ui";
import { PAYMENT_STATUS_META } from "@/constants/statuses";
import { BUSINESS } from "@/constants/business";
import { formatMoney, formatWeight } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import type { Shipment, ContactParty } from "@/types";
import { Barcode } from "./Barcode";

const INK = "#0f172a";
const SUB = "#475569";
const LINE = "#cbd5e1";

/** Small monochrome eagle mark for the label header (crisp on any printer). */
function LabelEagle({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 300 250" fill="none" aria-hidden>
      <g fill={INK}>
        <path d="M16 78 L150 52 Q172 49 188 60 L150 74 L40 92 Z" />
        <path d="M30 104 L150 84 Q176 81 196 92 L150 104 L52 116 Z" />
        <path d="M150 70 C176 58 206 56 232 70 C250 80 262 96 270 112 C274 120 270 126 262 124 L236 116 C246 128 252 140 250 150 C236 138 220 132 206 132 L150 104 C150 104 150 70 150 70 Z" />
        <path d="M150 104 L206 132 C214 150 210 172 192 190 C170 212 140 220 96 226 L150 150 Z" />
        <path d="M44 130 L150 116 L150 150 L96 226 L70 168 Z" />
      </g>
      <path d="M222 84 Q240 82 251 90 Q239 92 226 91 Z" fill="#ffffff" />
    </svg>
  );
}

export interface PackageLabelProps {
  shipment: Shipment;
  /** Which box this label is for (1-based). */
  pieceNumber: number;
  /** Total boxes in the shipment. */
  totalPieces: number;
}

/**
 * Printable 4×6 package label — one per physical box. Shows the eagle mark, a
 * prominent "PKG x of N" so boxes in a multi-piece shipment stay connected, a
 * scannable QR (links to tracking), a Code128 barcode, sender/receiver, key
 * metrics and contents.
 */
export function PackageLabel({ shipment, pieceNumber, totalPieces }: PackageLabelProps) {
  const description =
    shipment.packageDescription?.trim() ||
    shipment.items
      .map((item) => (item.quantity > 1 ? `${item.quantity}× ${item.itemType}` : item.itemType))
      .filter(Boolean)
      .join(", ") ||
    "General cargo";

  const trackUrl = `https://${BUSINESS.website}/track/${shipment.trackingNumber}`;

  return (
    <div
      className="print-label bg-white"
      style={{
        width: "4in",
        height: "6in",
        boxSizing: "border-box",
        border: `2px solid ${INK}`,
        borderRadius: 6,
        padding: "0.16in",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: INK,
        fontSize: 11,
        lineHeight: 1.22,
      }}
    >
      {/* Header — brand + piece counter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `2px solid ${INK}`,
          paddingBottom: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <LabelEagle size={24} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, fontStyle: "italic", letterSpacing: "-0.01em" }}>
              Liberty &amp; Liberty
            </div>
            <div style={{ fontSize: 7.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: SUB }}>
              Logistics
            </div>
          </div>
        </div>
        <div
          style={{
            border: `2px solid ${INK}`,
            borderRadius: 6,
            padding: "3px 10px",
            textAlign: "center",
            minWidth: 78,
          }}
        >
          <div style={{ fontSize: 7.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: SUB }}>
            Package
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1 }}>
            {pieceNumber} <span style={{ fontSize: 12, color: SUB }}>of</span> {totalPieces}
          </div>
        </div>
      </div>

      {/* Scan row — QR + tracking number */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${LINE}` }}>
        <div style={{ border: `1px solid ${INK}`, padding: 3, borderRadius: 4, lineHeight: 0 }}>
          <QRCodeSVG value={trackUrl} size={88} level="M" marginSize={0} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FieldLabel>Tracking number</FieldLabel>
          <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 800, letterSpacing: "0.02em", wordBreak: "break-all" }}>
            {shipment.trackingNumber}
          </div>
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge meta={PAYMENT_STATUS_META[shipment.paymentStatus]} />
            <span style={{ fontSize: 8.5, color: SUB }}>Scan to track</span>
          </div>
          <div style={{ marginTop: 2, fontSize: 9, fontWeight: 700, fontFamily: "monospace", color: SUB }}>
            {shipment.routeCode || "—"}
          </div>
        </div>
      </div>

      {/* Barcode */}
      <div style={{ padding: "6px 0 2px", textAlign: "center" }}>
        <Barcode value={shipment.trackingNumber} height={44} />
      </div>

      {/* FROM / TO */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderTop: `1px solid ${LINE}`,
          borderBottom: `1px solid ${LINE}`,
          padding: "6px 0",
        }}
      >
        <PartyBlock label="From (Sender)" party={shipment.sender} fallbackCountry={shipment.originCountry} />
        <div style={{ width: 1, background: LINE }} />
        <PartyBlock label="To (Receiver)" party={shipment.receiver} fallbackCountry={shipment.destinationCountry} />
      </div>

      {/* Route line */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0 4px", fontSize: 12, fontWeight: 800 }}>
        <span>
          {shipment.originCountry || "—"} <span style={{ color: "#94a3b8" }}>→</span> {shipment.destinationCountry || "—"}
        </span>
      </div>

      {/* Metrics grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 10px",
          padding: "4px 0",
          borderTop: `1px solid ${LINE}`,
        }}
      >
        <Metric label="Weight" value={formatWeight(shipment.weightLb)} />
        <Metric label="Declared value" value={formatMoney(shipment.declaredValue ?? 0)} />
        <Metric label="Created" value={formatDate(shipment.createdAt)} />
        <Metric label="Operations hub" value={shipment.assignedSealOffice || "Unassigned"} />
      </div>

      {/* Package description */}
      <div style={{ padding: "4px 0", borderTop: `1px solid ${LINE}` }}>
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

      {/* Footer — customer + piece restated */}
      <div
        style={{
          marginTop: "auto",
          borderTop: `2px solid ${INK}`,
          paddingTop: 6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <FieldLabel>Customer</FieldLabel>
          <div style={{ fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
            {shipment.customerName}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <FieldLabel>Box</FieldLabel>
          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800 }}>
            {pieceNumber} / {totalPieces}
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
      {party.address && <div style={{ fontSize: 9.5, color: SUB, lineHeight: 1.2 }}>{party.address}</div>}
      {locationParts.length > 0 && <div style={{ fontSize: 9.5, color: SUB }}>{locationParts.join(", ")}</div>}
      {party.phone && <div style={{ fontSize: 9.5, color: SUB }}>{party.phone}</div>}
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
    <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: SUB }}>
      {children}
    </div>
  );
}
