"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCustomer } from "@/lib/db/repositories/customers";
import { useCustomerShipments } from "@/lib/db/repositories/shipments";
import { useCustomerInvoices } from "@/lib/db/repositories/invoices";
import { useCustomerPayments } from "@/lib/db/repositories/payments";
import { Button, LoadingState, EmptyState, ErrorState } from "@/components/ui";
import { StatementDocument } from "@/components/customers/StatementDocument";

export default function CustomerStatementPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useAuth();

  const allowed = can("payments.view") || can("customers.view");

  const { data: customerData, loading: customerLoading, error: customerError } =
    useCustomer(allowed ? id : null);
  const { data: shipments, loading: shipmentsLoading } = useCustomerShipments(
    allowed ? id : null,
  );
  const { data: invoices, loading: invoicesLoading } = useCustomerInvoices(
    allowed ? id : null,
  );
  const { data: payments, loading: paymentsLoading } = useCustomerPayments(
    allowed ? id : null,
  );

  const customer = customerData[0];
  const loading =
    customerLoading || shipmentsLoading || invoicesLoading || paymentsLoading;

  // Access gate — render a brief notice instead of the statement.
  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={ShieldAlert}
          title="Access restricted"
          description="You don't have permission to view customer account statements."
        />
      </div>
    );
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Action bar — hidden when printing. */}
      <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/customers/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to customer
        </Link>
        {customer && (
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print / Download
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading statement…" />
      ) : customerError ? (
        <ErrorState message="Failed to load this customer's statement." />
      ) : !customer ? (
        <EmptyState
          title="Customer not found"
          description="This customer may have been removed."
        />
      ) : (
        <StatementDocument
          customer={customer}
          shipments={shipments}
          invoices={invoices}
          payments={payments}
        />
      )}
    </div>
  );
}
