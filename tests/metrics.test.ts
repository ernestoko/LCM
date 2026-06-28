import { describe, it, expect } from "vitest";
import {
  computeLibertyMetrics,
  computeSealMetrics,
  computeFinanceMetrics,
  countByStatus,
} from "@/lib/analytics/metrics";
import type {
  Shipment,
  Invoice,
  Payment,
  Complaint,
  Manifest,
  CountryRoute,
} from "@/types";

// Minimal, type-correct fixtures (cast — only the fields the functions read matter).
const ship = (s: Partial<Shipment>): Shipment => s as Shipment;
const inv = (i: Partial<Invoice>): Invoice => i as Invoice;
const pay = (p: Partial<Payment>): Payment => p as Payment;
const route = (r: Partial<CountryRoute>): CountryRoute => r as CountryRoute;
const manifest = (m: Partial<Manifest>): Manifest => m as Manifest;

describe("countByStatus", () => {
  it("tallies shipments by status", () => {
    const counts = countByStatus([
      ship({ status: "delivered" }),
      ship({ status: "delivered" }),
      ship({ status: "in_transit" }),
      ship({ status: "draft" }),
    ]);
    expect(counts).toEqual({ delivered: 2, in_transit: 1, draft: 1 });
  });

  it("returns an empty object for no shipments", () => {
    expect(countByStatus([])).toEqual({});
  });
});

describe("computeLibertyMetrics", () => {
  const shipments = [
    ship({ status: "delivered" }),
    ship({ status: "in_transit" }), // active
    ship({ status: "cancelled" }),
  ];
  const invoices = [
    inv({ paymentStatus: "paid", serviceFee: 30, balanceDue: 0, commission: { sealCharge: 200, serviceFee: 30, libertyCommission: 30, platformFee: 0, libertyEarnings: 30, basis: "x" } }),
    inv({ paymentStatus: "unpaid", serviceFee: 30, balanceDue: 145.7, commission: { sealCharge: 115.7, serviceFee: 30, libertyCommission: 17.36, platformFee: 0, libertyEarnings: 17.36, basis: "y" } }),
  ];
  const payments = [pay({ amount: 285 }), pay({ amount: 100 })];
  const complaints = [
    { status: "open" } as Complaint,
    { status: "resolved" } as Complaint,
    { status: "closed" } as Complaint,
  ];
  const routes = [route({ status: "active" }), route({ status: "active" }), route({ status: "draft" })];

  const m = computeLibertyMetrics(shipments, invoices, payments, complaints, routes);

  it("counts shipments by lifecycle bucket", () => {
    expect(m.totalShipments).toBe(3);
    expect(m.deliveredShipments).toBe(1);
    expect(m.activeShipments).toBe(1); // only in_transit is active
  });

  it("sums revenue from payments", () => {
    expect(m.revenue).toBe(385); // 285 + 100
  });

  it("sums Liberty earnings, SEAL charges and service fees from invoices", () => {
    expect(m.libertyEarnings).toBe(47.36); // 30 + 17.36
    expect(m.sealCharges).toBe(315.7); // 200 + 115.7
    expect(m.serviceFees).toBe(60); // 30 + 30
  });

  it("tracks pending invoices and their outstanding balance", () => {
    expect(m.pendingPayments).toBe(1); // one unpaid
    expect(m.pendingPaymentAmount).toBe(145.7);
  });

  it("counts active routes and open complaints", () => {
    expect(m.activeCountries).toBe(2);
    expect(m.openComplaints).toBe(1); // open only (resolved/closed excluded)
  });

  it("computes delivery rate over closed shipments", () => {
    // delivered 1 / (delivered 1 + cancelled 1) = 50%
    expect(m.deliveryRate).toBe(50);
  });
});

describe("computeSealMetrics", () => {
  const shipments = [
    ship({ status: "awaiting_package", sealHandlingStatus: "not_started" }),
    ship({ status: "received_by_seal", sealHandlingStatus: "intake_complete" }),
    ship({ status: "ready_for_dispatch", sealHandlingStatus: "manifested" }),
    ship({ status: "in_transit", sealHandlingStatus: "dispatched" }),
    ship({ status: "dispatched", sealHandlingStatus: "dispatched" }),
    ship({ status: "delivered", sealHandlingStatus: "delivered" }),
  ];
  const manifests = [
    manifest({ status: "draft" }),
    manifest({ status: "closed" }),
    manifest({ status: "arrived" }),
  ];

  const m = computeSealMetrics(shipments, manifests);

  it("counts intake, received and ready buckets", () => {
    expect(m.awaitingIntake).toBe(1);
    expect(m.received).toBe(1);
    expect(m.readyForDispatch).toBe(1);
  });

  it("counts in-transit (in_transit + dispatched) and delivered", () => {
    expect(m.inTransit).toBe(2);
    expect(m.delivered).toBe(1);
  });

  it("counts active manifests (not closed/arrived)", () => {
    expect(m.activeManifests).toBe(1); // only draft
  });
});

describe("computeFinanceMetrics", () => {
  const invoices = [
    inv({ total: 285, balanceDue: 0, commission: { sealCharge: 200, serviceFee: 30, libertyCommission: 30, platformFee: 0, libertyEarnings: 30, basis: "x" } }),
    inv({ total: 145.7, balanceDue: 145.7, commission: { sealCharge: 115.7, serviceFee: 30, libertyCommission: 17.36, platformFee: 0, libertyEarnings: 17.36, basis: "y" } }),
  ];
  const payments = [
    pay({ amount: 285, reconciliationStatus: "reconciled" }),
    pay({ amount: 50, reconciliationStatus: "disputed" }),
    pay({ amount: 25, reconciliationStatus: "unreconciled" }),
  ];

  const f = computeFinanceMetrics(invoices, payments);

  it("totals invoiced, collected and outstanding", () => {
    expect(f.totalInvoiced).toBe(430.7); // 285 + 145.7
    expect(f.totalCollected).toBe(360); // 285 + 50 + 25
    expect(f.outstanding).toBe(145.7);
  });

  it("counts disputed and unreconciled payments", () => {
    expect(f.disputed).toBe(1);
    expect(f.unreconciled).toBe(1);
  });

  it("totals SEAL payable and Liberty commission from invoices", () => {
    expect(f.sealPayable).toBe(315.7); // 200 + 115.7
    expect(f.libertyCommission).toBe(47.36); // 30 + 17.36
  });
});
