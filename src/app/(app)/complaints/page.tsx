"use client";

import { useMemo, useState } from "react";
import { Plus, MessageSquareWarning } from "lucide-react";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { isCustomer } from "@/lib/auth/permissions";
import {
  useComplaints,
  useCustomerComplaints,
  createComplaint,
  updateComplaint,
  resolveComplaint,
} from "@/lib/db/repositories/complaints";
import { notify } from "@/lib/notifications/service";
import {
  PageHeader,
  Button,
  Card,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  Badge,
  StatusBadge,
  Tabs,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from "@/components/ui";
import {
  COMPLAINT_TYPE_LABELS,
  COMPLAINT_STATUS_META,
} from "@/constants/statuses";
import { formatDate } from "@/lib/utils/dates";
import { titleCase } from "@/lib/utils/format";
import {
  NewTicketModal,
  ComplaintDetailModal,
  type NewTicketValues,
} from "@/components/complaints/ComplaintModals";
import type { Complaint, ComplaintStatus } from "@/types";

type FilterKey = "all" | "open" | "in_review" | "resolved" | "closed";

const FILTER_STATUS: Record<Exclude<FilterKey, "all">, ComplaintStatus[]> = {
  open: ["open", "awaiting_customer"],
  in_review: ["in_review"],
  resolved: ["resolved"],
  closed: ["closed"],
};

const PRIORITY_TONE: Record<Complaint["priority"], "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export default function ComplaintsPage() {
  const { user, role, can } = useAuth();
  const actor = useActor();
  const { success, error: toastError } = useToast();

  const isCust = isCustomer(role);
  const customerScoped = useCustomerComplaints(isCust ? user?.customerId : undefined);
  const staffScoped = useComplaints();
  const { data, loading, error } = isCust ? customerScoped : staffScoped;

  const canManage = can("complaints.manage");

  const [filter, setFilter] = useState<FilterKey>("all");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep the open detail modal in sync with live data.
  const selected = useMemo(
    () => data.find((c) => c.id === selectedId) ?? null,
    [data, selectedId],
  );

  const counts = useMemo(() => {
    const c = { all: data.length, open: 0, in_review: 0, resolved: 0, closed: 0 };
    for (const t of data) {
      if (t.status === "open" || t.status === "awaiting_customer") c.open += 1;
      else if (t.status === "in_review") c.in_review += 1;
      else if (t.status === "resolved") c.resolved += 1;
      else if (t.status === "closed") c.closed += 1;
    }
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    if (filter === "all") return data;
    return data.filter((t) => FILTER_STATUS[filter].includes(t.status));
  }, [data, filter]);

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "open", label: "Open", count: counts.open },
    { key: "in_review", label: "In Review", count: counts.in_review },
    { key: "resolved", label: "Resolved", count: counts.resolved },
    { key: "closed", label: "Closed", count: counts.closed },
  ];

  async function handleCreate(values: NewTicketValues) {
    await createComplaint(
      {
        type: values.type,
        trackingNumber: values.trackingNumber || undefined,
        customerId: isCust ? user?.customerId : undefined,
        customerName: isCust ? user?.displayName : undefined,
        description: values.description,
        attachmentUrls: values.attachmentUrls,
        priority: values.priority,
      },
      actor,
    );
    success("Ticket submitted.");
    setCreating(false);
  }

  async function handleAssign(complaint: Complaint) {
    await updateComplaint(
      complaint.id,
      { assignedTo: actor.uid, assignedToName: actor.name, status: "in_review" },
      actor,
    );
    success("Ticket assigned to you.");
  }

  async function handleChangeStatus(complaint: Complaint, status: ComplaintStatus) {
    await updateComplaint(complaint.id, { status }, actor);
    success(`Status set to ${COMPLAINT_STATUS_META[status].label}.`);
  }

  async function handleResolve(complaint: Complaint, notes: string) {
    await resolveComplaint(complaint.id, notes, actor);
    success("Ticket resolved.");
    // Best-effort customer notification.
    if (complaint.customerName) {
      void notify(
        "complaint_update",
        { name: complaint.customerName },
        { ticketNumber: complaint.ticketNumber, status: "resolved" },
      ).catch(() => {});
    }
  }

  return (
    <div>
      <PageHeader
        title="Claims & Complaints"
        description="Track and resolve customer claims about shipments."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        }
      />

      <Tabs tabs={tabs} active={filter} onChange={(k) => setFilter(k as FilterKey)} />

      <div className="mt-4">
        {loading ? (
          <LoadingState label="Loading tickets…" />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquareWarning}
            title="No tickets"
            description={
              filter !== "all"
                ? "No tickets match this filter."
                : "Raise a ticket to report an issue with a shipment."
            }
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> New Ticket
              </Button>
            }
          />
        ) : (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Ticket #</TH>
                  <TH>Type</TH>
                  <TH>Customer</TH>
                  <TH>Tracking</TH>
                  <TH>Priority</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((t: Complaint) => (
                  <TR key={t.id} onClick={() => setSelectedId(t.id)}>
                    <TD className="font-mono text-xs font-medium text-brand-600">
                      {t.ticketNumber}
                    </TD>
                    <TD className="font-medium text-navy-800">
                      {COMPLAINT_TYPE_LABELS[t.type]}
                    </TD>
                    <TD className="text-xs">{t.customerName || "—"}</TD>
                    <TD className="font-mono text-xs">{t.trackingNumber || "—"}</TD>
                    <TD>
                      <Badge tone={PRIORITY_TONE[t.priority]}>{titleCase(t.priority)}</Badge>
                    </TD>
                    <TD>
                      <StatusBadge meta={COMPLAINT_STATUS_META[t.status]} />
                    </TD>
                    <TD className="text-xs text-navy-400">{formatDate(t.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>

      <NewTicketModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={handleCreate}
      />

      <ComplaintDetailModal
        complaint={selected}
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        canManage={canManage}
        onAssign={handleAssign}
        onChangeStatus={handleChangeStatus}
        onResolve={handleResolve}
      />
    </div>
  );
}
