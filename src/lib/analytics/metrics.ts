import type {
  Shipment,
  Invoice,
  Payment,
  Complaint,
  Manifest,
  CountryRoute,
} from "@/types";
import { ACTIVE_SHIPMENT_STATUSES } from "@/constants/statuses";
import { round2 } from "@/lib/utils/format";
import { daysBetween } from "@/lib/utils/dates";

export interface LibertyMetrics {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  pendingPayments: number;
  pendingPaymentAmount: number;
  revenue: number;
  libertyEarnings: number;
  sealCharges: number;
  serviceFees: number;
  activeCountries: number;
  openComplaints: number;
  delayedShipments: number;
  deliveryRate: number; // %
}

const activeSet = new Set<string>(ACTIVE_SHIPMENT_STATUSES);

export function computeLibertyMetrics(
  shipments: Shipment[],
  invoices: Invoice[],
  payments: Payment[],
  complaints: Complaint[],
  routes: CountryRoute[],
): LibertyMetrics {
  const delivered = shipments.filter((s) => s.status === "delivered");
  const active = shipments.filter((s) => activeSet.has(s.status));
  const closed = delivered.length + shipments.filter((s) => s.status === "cancelled").length;

  const revenue = round2(payments.reduce((sum, p) => sum + (p.amount || 0), 0));
  const libertyEarnings = round2(
    invoices.reduce((sum, i) => sum + (i.commission?.libertyEarnings || 0), 0),
  );
  const sealCharges = round2(
    invoices.reduce((sum, i) => sum + (i.commission?.sealCharge || 0), 0),
  );
  const serviceFees = round2(invoices.reduce((sum, i) => sum + (i.serviceFee || 0), 0));

  const pendingInvoices = invoices.filter(
    (i) => i.paymentStatus === "unpaid" || i.paymentStatus === "partial",
  );
  const pendingPaymentAmount = round2(pendingInvoices.reduce((s, i) => s + (i.balanceDue || 0), 0));

  const delayed = active.filter((s) => {
    if (!s.expectedDeliveryDate) return false;
    const d = daysBetween(s.expectedDeliveryDate, new Date().toISOString());
    return d != null && d > 0; // expected date is in the past, still active
  }).length;

  return {
    totalShipments: shipments.length,
    activeShipments: active.length,
    deliveredShipments: delivered.length,
    pendingPayments: pendingInvoices.length,
    pendingPaymentAmount,
    revenue,
    libertyEarnings,
    sealCharges,
    serviceFees,
    activeCountries: routes.filter((r) => r.status === "active").length,
    openComplaints: complaints.filter((c) => c.status !== "closed" && c.status !== "resolved").length,
    delayedShipments: delayed,
    deliveryRate: closed > 0 ? Math.round((delivered.length / closed) * 100) : 0,
  };
}

export interface SealMetrics {
  awaitingIntake: number;
  received: number;
  readyForDispatch: number;
  activeManifests: number;
  inTransit: number;
  delivered: number;
  outstandingUpdates: number;
}

export function computeSealMetrics(shipments: Shipment[], manifests: Manifest[]): SealMetrics {
  const count = (pred: (s: Shipment) => boolean) => shipments.filter(pred).length;
  return {
    awaitingIntake: count(
      (s) => s.status === "awaiting_package" || s.sealHandlingStatus === "awaiting_intake",
    ),
    received: count((s) => s.status === "received_by_seal" || s.sealHandlingStatus === "intake_complete"),
    readyForDispatch: count((s) => s.status === "ready_for_dispatch" || s.status === "added_to_manifest"),
    activeManifests: manifests.filter(
      (m) => m.status !== "closed" && m.status !== "arrived",
    ).length,
    inTransit: count((s) => s.status === "in_transit" || s.status === "dispatched"),
    delivered: count((s) => s.status === "delivered"),
    outstandingUpdates: count(
      (s) =>
        s.sealHandlingStatus !== "delivered" &&
        (s.status === "in_transit" || s.status === "arrived_ghana" || s.status === "customs_clearing"),
    ),
  };
}

export interface FinanceMetrics {
  totalInvoiced: number;
  totalCollected: number;
  outstanding: number;
  disputed: number;
  unreconciled: number;
  sealPayable: number;
  libertyCommission: number;
}

export function computeFinanceMetrics(invoices: Invoice[], payments: Payment[]): FinanceMetrics {
  const totalInvoiced = round2(invoices.reduce((s, i) => s + (i.total || 0), 0));
  const totalCollected = round2(payments.reduce((s, p) => s + (p.amount || 0), 0));
  return {
    totalInvoiced,
    totalCollected,
    outstanding: round2(invoices.reduce((s, i) => s + (i.balanceDue || 0), 0)),
    disputed: payments.filter((p) => p.reconciliationStatus === "disputed").length,
    unreconciled: payments.filter((p) => p.reconciliationStatus === "unreconciled").length,
    sealPayable: round2(invoices.reduce((s, i) => s + (i.commission?.sealCharge || 0), 0)),
    libertyCommission: round2(invoices.reduce((s, i) => s + (i.commission?.libertyEarnings || 0), 0)),
  };
}

/** Group a numeric series by status for simple bar visualisations. */
export function countByStatus(shipments: Shipment[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of shipments) out[s.status] = (out[s.status] ?? 0) + 1;
  return out;
}
