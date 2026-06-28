"use client";

import { orderBy, where } from "firebase/firestore";
import { create, update, nextSequence } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import { formatPaymentNumber } from "@/lib/utils/ids";
import { applyPaymentToInvoice } from "./invoices";
import { bumpCustomerStats } from "./customers";
import { GATEWAY_METHODS } from "@/types";
import type { Payment } from "@/types";

export type NewPayment = Omit<
  Payment,
  "id" | "receiptNumber" | "recordedBy" | "reconciliationStatus" | "createdAt" | "createdBy"
> & { reconciliationStatus?: Payment["reconciliationStatus"] };

export async function recordPayment(
  data: NewPayment,
  actor: AuditActor,
): Promise<string> {
  const seq = await nextSequence("payment");
  const id = await create<Partial<Payment>>(
    COLLECTIONS.payments,
    {
      ...data,
      receiptNumber: formatPaymentNumber(seq),
      recordedBy: actor.uid,
      recordedByName: actor.name,
      // Paystack/PayPal confirm payment at the gateway, so they auto-reconcile.
      reconciliationStatus:
        data.reconciliationStatus ??
        (GATEWAY_METHODS.includes(data.method) ? "reconciled" : "unreconciled"),
    },
    actor,
  );

  // Update the linked invoice + customer spend.
  await applyPaymentToInvoice(data.invoiceId, data.amount, actor);
  if (data.customerId) await bumpCustomerStats(data.customerId, 0, data.amount);

  await logAudit(actor, {
    action: "payment_update",
    entity: COLLECTIONS.payments,
    entityId: id,
    newValue: `${data.currency} ${data.amount}`,
  });
  return id;
}

export async function setReconciliationStatus(
  id: string,
  status: Payment["reconciliationStatus"],
  actor: AuditActor,
): Promise<void> {
  await update<Payment>(COLLECTIONS.payments, id, { reconciliationStatus: status }, actor);
  await logAudit(actor, {
    action: "payment_update",
    entity: COLLECTIONS.payments,
    entityId: id,
    field: "reconciliationStatus",
    newValue: status,
  });
}

export function usePayments() {
  return useCollection<Payment>(COLLECTIONS.payments, [orderBy("paymentDate", "desc")]);
}

export function useCustomerPayments(customerId: string | null | undefined) {
  return useCollection<Payment>(
    COLLECTIONS.payments,
    customerId ? [where("customerId", "==", customerId), orderBy("paymentDate", "desc")] : [],
    { enabled: Boolean(customerId), deps: ["customer-payments", customerId] },
  );
}
