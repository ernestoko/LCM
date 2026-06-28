"use client";

import { useMemo, useState } from "react";
import { CreditCard, Download } from "lucide-react";
import type {
  Invoice,
  Payment,
  PaymentMethod,
  ReconciliationStatus,
} from "@/types";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { isFinance } from "@/lib/auth/permissions";
import { useInvoices } from "@/lib/db/repositories/invoices";
import {
  usePayments,
  recordPayment,
  setReconciliationStatus,
} from "@/lib/db/repositories/payments";
import { notify } from "@/lib/notifications/service";
import { computeFinanceMetrics } from "@/lib/analytics/metrics";
import { downloadCsv } from "@/components/payments/csv";
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardBody,
  StatCard,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  Badge,
  Field,
  Input,
  Select,
  Modal,
  LoadingState,
  ErrorState,
  EmptyState,
  KeyValue,
  useToast,
} from "@/components/ui";
import { PAYMENT_METHOD_LABELS } from "@/constants/statuses";
import { formatMoney } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import type { BadgeTone } from "@/constants/statuses";

const RECON_META: Record<ReconciliationStatus, { label: string; tone: BadgeTone }> = {
  unreconciled: { label: "Unreconciled", tone: "warning" },
  reconciled: { label: "Reconciled", tone: "success" },
  disputed: { label: "Disputed", tone: "danger" },
};

const todayISODate = () => new Date().toISOString().slice(0, 10);

export default function PaymentsPage() {
  return (
    <RequirePermission permission="payments.view">
      <PaymentsWorkspace />
    </RequirePermission>
  );
}

function PaymentsWorkspace() {
  const { role, can } = useAuth();
  const actor = useActor();
  const { success, error } = useToast();

  const { data: invoices, loading: invLoading } = useInvoices();
  const { data: payments, loading: payLoading, error: payError } = usePayments();

  const metrics = useMemo(
    () => computeFinanceMetrics(invoices, payments),
    [invoices, payments],
  );

  const outstanding = useMemo(
    () => invoices.filter((i) => i.balanceDue > 0),
    [invoices],
  );

  const canExport = isFinance(role) || can("reports.export");

  // Record-payment modal state.
  const [payOpen, setPayOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISODate());
  const [busy, setBusy] = useState(false);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const selectedInvoice = outstanding.find((i) => i.id === invoiceId) ?? null;

  function openPayModal() {
    const first = outstanding[0] ?? null;
    setInvoiceId(first?.id ?? "");
    setAmount(first ? String(first.balanceDue) : "");
    setMethod("bank_transfer");
    setReference("");
    setPaymentDate(todayISODate());
    setPayOpen(true);
  }

  function handleSelectInvoice(nextId: string) {
    setInvoiceId(nextId);
    const inv = outstanding.find((i) => i.id === nextId);
    if (inv) setAmount(String(inv.balanceDue));
  }

  async function handleRecordPayment() {
    const inv = selectedInvoice;
    if (!inv) {
      error("Select an outstanding invoice.");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      error("Enter a valid payment amount.");
      return;
    }
    setBusy(true);
    try {
      await recordPayment(
        {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          shipmentId: inv.shipmentId,
          customerId: inv.customerId,
          customerName: inv.customerName,
          currency: inv.currency,
          amount: value,
          method,
          reference: reference.trim() || undefined,
          paymentDate: new Date(paymentDate).toISOString(),
        },
        actor,
      );

      const newBalance = Math.max(0, inv.total - ((inv.amountPaid ?? 0) + value));
      if (newBalance <= 0) {
        await notify(
          "payment_confirmed",
          { name: inv.customerName },
          { trackingNumber: inv.trackingNumber },
          { shipmentId: inv.shipmentId },
        );
      }

      success("Payment recorded.");
      setPayOpen(false);
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReconcile(payment: Payment, status: ReconciliationStatus) {
    setReconcilingId(payment.id);
    try {
      await setReconciliationStatus(payment.id, status, actor);
      success(`Marked ${RECON_META[status].label.toLowerCase()}.`);
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to update reconciliation.");
    } finally {
      setReconcilingId(null);
    }
  }

  function handleExport() {
    const rows = payments.map((p) => ({
      receiptNumber: p.receiptNumber,
      paymentDate: formatDate(p.paymentDate),
      customer: p.customerName,
      invoiceNumber: p.invoiceNumber,
      currency: p.currency,
      amount: p.amount,
      method: PAYMENT_METHOD_LABELS[p.method] ?? p.method,
      reference: p.reference ?? "",
      reconciliation: RECON_META[p.reconciliationStatus]?.label ?? p.reconciliationStatus,
      recordedBy: p.recordedByName ?? p.recordedBy,
    }));
    if (rows.length === 0) {
      error("No payments to export.");
      return;
    }
    downloadCsv(`reconciliation-${todayISODate()}.csv`, rows);
    success("Reconciliation CSV exported.");
  }

  const report = useMemo(() => {
    const completed = payments.filter((p) => p.reconciliationStatus === "reconciled").length;
    const sealCharges = invoices.reduce((s, i) => s + (i.commission?.sealCharge ?? 0), 0);
    const libertyCommission = invoices.reduce(
      (s, i) => s + (i.commission?.libertyEarnings ?? 0),
      0,
    );
    return {
      totalShipments: invoices.length,
      totalCustomerPayments: metrics.totalCollected,
      totalSealCharges: sealCharges,
      totalLibertyCommission: libertyCommission,
      pendingPayments: metrics.outstanding,
      disputed: metrics.disputed,
      completed,
    };
  }, [invoices, payments, metrics]);

  const loading = invLoading || payLoading;
  const currency = invoices[0]?.currency ?? payments[0]?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments &amp; Reconciliation"
        description="Record customer payments and reconcile against SEAL settlements."
        actions={
          can("payments.record") ? (
            <Button onClick={openPayModal} disabled={outstanding.length === 0}>
              <CreditCard className="h-4 w-4" /> Record Payment
            </Button>
          ) : undefined
        }
      />

      {/* Finance metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total invoiced"
          value={formatMoney(metrics.totalInvoiced, currency)}
          icon="FileText"
          tone="brand"
        />
        <StatCard
          label="Collected"
          value={formatMoney(metrics.totalCollected, currency)}
          icon="CheckCircle2"
          tone="emerald"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(metrics.outstanding, currency)}
          icon="AlertCircle"
          tone="red"
        />
        <StatCard
          label="SEAL payable"
          value={formatMoney(metrics.sealPayable, currency)}
          icon="Truck"
          tone="violet"
        />
        <StatCard
          label="Liberty commission"
          value={formatMoney(metrics.libertyCommission, currency)}
          icon="Wallet"
          tone="gold"
        />
      </div>

      {/* Weekly reconciliation report */}
      <Card>
        <CardHeader
          title="Weekly Reconciliation Report"
          subtitle="Settlement summary across all invoices and recorded payments."
          action={
            canExport ? (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            ) : undefined
          }
        />
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <KeyValue label="Total shipments">{report.totalShipments}</KeyValue>
          <KeyValue label="Customer payments">
            {formatMoney(report.totalCustomerPayments, currency)}
          </KeyValue>
          <KeyValue label="SEAL charges">
            {formatMoney(report.totalSealCharges, currency)}
          </KeyValue>
          <KeyValue label="Liberty commission">
            {formatMoney(report.totalLibertyCommission, currency)}
          </KeyValue>
          <KeyValue label="Pending payments">
            {formatMoney(report.pendingPayments, currency)}
          </KeyValue>
          <KeyValue label="Disputed">{report.disputed}</KeyValue>
          <KeyValue label="Completed (reconciled)">{report.completed}</KeyValue>
        </CardBody>
      </Card>

      {/* Payments table */}
      <Card>
        <CardHeader title="Payments" subtitle={`${payments.length} recorded`} />
        {loading ? (
          <LoadingState label="Loading payments…" />
        ) : payError ? (
          <div className="p-5">
            <ErrorState message={payError.message} />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CreditCard}
              title="No payments recorded"
              description="Record a payment against an outstanding invoice to get started."
            />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Receipt #</TH>
                <TH>Customer</TH>
                <TH>Invoice #</TH>
                <TH className="text-right">Amount</TH>
                <TH>Method</TH>
                <TH>Date</TH>
                <TH>Reconciliation</TH>
                {can("payments.reconcile") && <TH>Set status</TH>}
              </TR>
            </THead>
            <TBody>
              {payments.map((p) => (
                <TR key={p.id}>
                  <TD className="font-mono text-xs font-medium text-brand-600">{p.receiptNumber}</TD>
                  <TD className="font-medium text-navy-800">{p.customerName}</TD>
                  <TD className="font-mono text-xs text-navy-600">{p.invoiceNumber}</TD>
                  <TD className="text-right font-medium text-navy-800">
                    {formatMoney(p.amount, p.currency)}
                  </TD>
                  <TD className="text-xs">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</TD>
                  <TD className="text-xs text-navy-400">{formatDate(p.paymentDate)}</TD>
                  <TD>
                    <Badge tone={RECON_META[p.reconciliationStatus]?.tone ?? "neutral"}>
                      {RECON_META[p.reconciliationStatus]?.label ?? p.reconciliationStatus}
                    </Badge>
                  </TD>
                  {can("payments.reconcile") && (
                    <TD>
                      <Select
                        value={p.reconciliationStatus}
                        disabled={reconcilingId === p.id}
                        onChange={(e) =>
                          handleReconcile(p, e.target.value as ReconciliationStatus)
                        }
                        className="h-8 py-1 text-xs"
                      >
                        {(Object.keys(RECON_META) as ReconciliationStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {RECON_META[s].label}
                          </option>
                        ))}
                      </Select>
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Record payment modal */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record payment"
        description="Apply a payment against an outstanding invoice."
        footer={
          <>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} loading={busy} disabled={!selectedInvoice}>
              Record payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Invoice" required>
            <Select value={invoiceId} onChange={(e) => handleSelectInvoice(e.target.value)}>
              <option value="" disabled>
                Select an outstanding invoice…
              </option>
              {outstanding.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerName} ({formatMoney(inv.balanceDue, inv.currency)})
                </option>
              ))}
            </Select>
          </Field>

          {selectedInvoice && (
            <Card className="bg-navy-50/60">
              <CardBody className="flex items-center justify-between py-3">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-400">
                  Balance due
                </span>
                <span className="text-sm font-semibold text-navy-900">
                  {formatMoney(selectedInvoice.balanceDue, selectedInvoice.currency)}
                </span>
              </CardBody>
            </Card>
          )}

          <Field
            label="Amount"
            required
            hint={selectedInvoice ? `Currency: ${selectedInvoice.currency}` : undefined}
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>

          <Field label="Method" required>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Reference" hint="Transaction ID, cheque #, etc. (optional)">
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. MM-20260628-0042"
            />
          </Field>

          <Field label="Payment date" required>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
