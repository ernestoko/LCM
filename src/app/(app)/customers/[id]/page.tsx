"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, ShieldAlert, Pencil, ShieldCheck } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import {
  useCustomer,
  updateCustomer,
} from "@/lib/db/repositories/customers";
import { useCustomerShipments } from "@/lib/db/repositories/shipments";
import { useCustomerInvoices } from "@/lib/db/repositories/invoices";
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardBody,
  Badge,
  StatusBadge,
  KeyValue,
  Modal,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from "@/components/ui";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { formatMoney } from "@/lib/utils/format";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_SOURCE_LABELS,
  SHIPMENT_STATUS_META,
} from "@/constants/statuses";
import type { BadgeTone } from "@/constants/statuses";
import type { Customer, ContactParty, CustomerSource } from "@/types";
import type { NewCustomer } from "@/lib/db/repositories/customers";

const SOURCE_TONE: Record<CustomerSource, BadgeTone> = {
  liberty: "info",
  seal: "purple",
  referral: "gold",
  walk_in: "neutral",
  online: "success",
  campaign: "warning",
};

const ID_TYPE_LABELS: Record<string, string> = {
  ghana_card: "Ghana Card",
  passport: "Passport",
  drivers_license: "Driver's License",
  national_id: "National ID",
  other: "Other",
};

export default function CustomerDetailPage() {
  return (
    <RequirePermission permission="customers.view">
      <CustomerDetail />
    </RequirePermission>
  );
}

function CustomerDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useAuth();
  const actor = useActor();
  const { success, error: toastError } = useToast();

  const { data, loading, error } = useCustomer(id);
  const customer = data[0];

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(values: NewCustomer) {
    setSaving(true);
    try {
      await updateCustomer(id, values, actor);
      success("Customer updated.");
      setEditing(false);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to update customer.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading customer…" />;
  if (error) return <ErrorState message="Failed to load this customer." />;
  if (!customer) {
    return (
      <div>
        <BackLink />
        <EmptyState title="Customer not found" description="This customer may have been removed." />
      </div>
    );
  }

  return (
    <div>
      <BackLink />

      <PageHeader
        title={customer.fullName}
        description={`${CUSTOMER_TYPE_LABELS[customer.customerType]} · ${customer.customerCode}`}
        actions={
          can("customers.edit") && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — profile */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Profile" />
            <CardBody className="grid gap-5 sm:grid-cols-2">
              <KeyValue label="Phone">{customer.phone}</KeyValue>
              <KeyValue label="Email">{customer.email}</KeyValue>
              <KeyValue label="Country">{customer.country}</KeyValue>
              <KeyValue label="City">{customer.city}</KeyValue>
              <KeyValue label="Address">{customer.address}</KeyValue>
              <KeyValue label="Customer code">
                <span className="font-mono">{customer.customerCode}</span>
              </KeyValue>
              <KeyValue label="Type">
                <Badge tone="neutral">{CUSTOMER_TYPE_LABELS[customer.customerType]}</Badge>
              </KeyValue>
              <KeyValue label="Source">
                <Badge tone={SOURCE_TONE[customer.source]}>
                  {CUSTOMER_SOURCE_LABELS[customer.source]}
                </Badge>
              </KeyValue>
              {customer.referredBy && (
                <KeyValue label="Referred by">{customer.referredBy}</KeyValue>
              )}
              <KeyValue label="Created">{formatDateTime(customer.createdAt)}</KeyValue>
              {customer.notes && (
                <div className="sm:col-span-2">
                  <KeyValue label="Notes">{customer.notes}</KeyValue>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Default contacts" subtitle="Pre-filled when creating shipments." />
            <CardBody className="grid gap-6 sm:grid-cols-2">
              <PartyView label="Default sender" party={customer.defaultSender} />
              <PartyView label="Default receiver" party={customer.defaultReceiver} />
            </CardBody>
          </Card>

          <ShipmentHistoryCard customerId={id} />
        </div>

        {/* Right column — status, ID, invoices, ownership */}
        <div className="space-y-6">
          <IdVerificationCard idVerification={customer.idVerification} />

          <InvoicesSummaryCard customerId={id} />

          <Card>
            <CardHeader title="Activity" />
            <CardBody className="grid grid-cols-2 gap-4">
              <KeyValue label="Shipments">{customer.shipmentCount}</KeyValue>
              <KeyValue label="Total spend">{formatMoney(customer.totalSpend)}</KeyValue>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  Owned by Liberty Cargo Movers
                </p>
                <p className="mt-0.5 text-xs text-navy-500">
                  This customer record is owned and managed by Liberty Cargo Movers. Ownership is
                  immutable.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit customer"
        description={customer.fullName}
        size="xl"
      >
        <CustomerForm initial={customer} onSubmit={handleSave} submitting={saving} />
      </Modal>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/customers"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
    >
      <ArrowLeft className="h-4 w-4" /> Back to customers
    </Link>
  );
}

function PartyView({ label, party }: { label: string; party?: ContactParty }) {
  if (!party?.name) {
    return (
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-500">{label}</p>
        <p className="text-sm text-navy-400">Not set</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{label}</p>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-navy-800">{party.name}</p>
        {party.phone && <p className="text-sm text-navy-600">{party.phone}</p>}
        {party.email && <p className="text-sm text-navy-600">{party.email}</p>}
        {party.address && <p className="text-sm text-navy-600">{party.address}</p>}
        {party.country && <p className="text-sm text-navy-600">{party.country}</p>}
      </div>
    </div>
  );
}

function IdVerificationCard({
  idVerification,
}: {
  idVerification?: Customer["idVerification"];
}) {
  const verified = idVerification?.verified ?? false;
  const hasId = Boolean(idVerification?.type || idVerification?.number || idVerification?.documentUrl);

  return (
    <Card>
      <CardHeader title="ID verification" />
      <CardBody className="space-y-4">
        <div className="flex items-center gap-2">
          {verified ? (
            <Badge tone="success">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </Badge>
          ) : (
            <Badge tone="warning">
              <ShieldAlert className="h-3.5 w-3.5" /> Unverified
            </Badge>
          )}
        </div>
        {hasId ? (
          <div className="grid gap-4">
            <KeyValue label="Type">
              {idVerification?.type ? ID_TYPE_LABELS[idVerification.type] ?? idVerification.type : "—"}
            </KeyValue>
            <KeyValue label="Number">{idVerification?.number}</KeyValue>
            {verified && idVerification?.verifiedAt && (
              <KeyValue label="Verified on">{formatDate(idVerification.verifiedAt)}</KeyValue>
            )}
            <KeyValue label="Document">
              {idVerification?.documentUrl ? (
                <a
                  href={idVerification.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  View document
                </a>
              ) : (
                "—"
              )}
            </KeyValue>
          </div>
        ) : (
          <p className="text-sm text-navy-400">No identification on file.</p>
        )}
      </CardBody>
    </Card>
  );
}

function ShipmentHistoryCard({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { data: shipments, loading, error } = useCustomerShipments(customerId);

  return (
    <Card>
      <CardHeader title="Shipment history" subtitle={`${shipments.length} shipment${shipments.length === 1 ? "" : "s"}`} />
      {loading ? (
        <LoadingState label="Loading shipments…" />
      ) : error ? (
        <div className="p-5">
          <ErrorState message="Failed to load shipments." />
        </div>
      ) : shipments.length === 0 ? (
        <div className="p-5">
          <EmptyState title="No shipments yet" description="This customer has no shipments on record." />
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Tracking</TH>
              <TH>Route</TH>
              <TH>Status</TH>
              <TH>Date</TH>
            </TR>
          </THead>
          <TBody>
            {shipments.map((s) => (
              <TR key={s.id} onClick={() => router.push(`/shipments/${s.id}`)}>
                <TD className="font-mono text-xs font-medium text-brand-600">{s.trackingNumber}</TD>
                <TD className="text-navy-700">{s.routeCode}</TD>
                <TD>
                  <StatusBadge meta={SHIPMENT_STATUS_META[s.status]} />
                </TD>
                <TD className="text-xs text-navy-400">{formatDate(s.createdAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}

function InvoicesSummaryCard({ customerId }: { customerId: string }) {
  const { data: invoices, loading } = useCustomerInvoices(customerId);

  const outstanding = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.balanceDue ?? 0), 0),
    [invoices],
  );
  const currency = invoices[0]?.currency ?? "USD";

  return (
    <Card>
      <CardHeader
        title="Invoices"
        action={
          <Link href="/invoices" className="text-xs font-medium text-brand-600 hover:underline">
            View all
          </Link>
        }
      />
      <CardBody>
        {loading ? (
          <LoadingState label="Loading invoices…" />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <KeyValue label="Invoices">{invoices.length}</KeyValue>
            <KeyValue label="Outstanding">
              <span className={outstanding > 0 ? "font-semibold text-red-600" : "text-navy-800"}>
                {formatMoney(outstanding, currency)}
              </span>
            </KeyValue>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
