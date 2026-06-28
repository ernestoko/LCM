"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, CreditCard } from "lucide-react";
import type { Invoice, PaymentMethod } from "@/types";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { isLiberty, isFinance } from "@/lib/auth/permissions";
import { useDocument } from "@/lib/db/hooks";
import { COLLECTIONS } from "@/lib/db/collections";
import { recordPayment } from "@/lib/db/repositories/payments";
import { notify } from "@/lib/notifications/service";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import {
  Button,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Modal,
  LoadingState,
  ErrorState,
  EmptyState,
  useToast,
} from "@/components/ui";
import { PAYMENT_METHOD_LABELS } from "@/constants/statuses";
import { formatMoney } from "@/lib/utils/format";

const todayISODate = () => new Date().toISOString().slice(0, 10);

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { role, can } = useAuth();
  const actor = useActor();
  const { success, error } = useToast();

  const { data: invoice, loading, error: loadError } = useDocument<Invoice>(
    COLLECTIONS.invoices,
    id,
  );

  const showCommission = isLiberty(role) || isFinance(role);

  // Record-payment modal state.
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISODate());
  const [busy, setBusy] = useState(false);

  function openPayModal(inv: Invoice) {
    setAmount(String(inv.balanceDue > 0 ? inv.balanceDue : ""));
    setMethod("bank_transfer");
    setReference("");
    setPaymentDate(todayISODate());
    setPayOpen(true);
  }

  async function handleRecordPayment() {
    if (!invoice) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      error("Enter a valid payment amount.");
      return;
    }
    setBusy(true);
    try {
      await recordPayment(
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          shipmentId: invoice.shipmentId,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          currency: invoice.currency,
          amount: value,
          method,
          reference: reference.trim() || undefined,
          paymentDate: new Date(paymentDate).toISOString(),
        },
        actor,
      );

      // If this payment clears the balance, confirm to the customer.
      const newBalance = Math.max(0, invoice.total - ((invoice.amountPaid ?? 0) + value));
      if (newBalance <= 0) {
        await notify(
          "payment_confirmed",
          { name: invoice.customerName },
          { trackingNumber: invoice.trackingNumber },
          { shipmentId: invoice.shipmentId },
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

  if (loading) return <LoadingState label="Loading invoice…" />;
  if (loadError) return <ErrorState message={loadError.message} />;
  if (!invoice) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          icon={CreditCard}
          title="Invoice not found"
          description="It may have been removed or you don't have access."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Action bar — hidden when printing. */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BackLink />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Download
          </Button>
          {can("payments.record") && invoice.balanceDue > 0 && (
            <Button onClick={() => openPayModal(invoice)}>
              <CreditCard className="h-4 w-4" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      <InvoiceDocument invoice={invoice} showCommission={showCommission} />

      {/* Record payment modal */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record payment"
        description={`Apply a payment against ${invoice.invoiceNumber}.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} loading={busy}>
              Record payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Card className="bg-navy-50/60">
            <CardBody className="flex items-center justify-between py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-400">
                Balance due
              </span>
              <span className="text-sm font-semibold text-navy-900">
                {formatMoney(invoice.balanceDue, invoice.currency)}
              </span>
            </CardBody>
          </Card>

          <Field label="Amount" required hint={`Currency: ${invoice.currency}`}>
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

function BackLink() {
  return (
    <Link
      href="/invoices"
      className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-800"
    >
      <ArrowLeft className="h-4 w-4" /> Back to invoices
    </Link>
  );
}
