"use client";

import { useState } from "react";
import { Paperclip, UserCheck, CheckCircle2 } from "lucide-react";
import {
  Modal,
  Button,
  Badge,
  StatusBadge,
  KeyValue,
  Field,
  Input,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  COMPLAINT_TYPE_LABELS,
  COMPLAINT_STATUS_META,
} from "@/constants/statuses";
import { formatDateTime } from "@/lib/utils/dates";
import { titleCase } from "@/lib/utils/format";
import { uploadFiles } from "@/lib/firebase/storage";
import type { Complaint, ComplaintType, ComplaintStatus } from "@/types";

const COMPLAINT_TYPES: ComplaintType[] = [
  "lost_package",
  "damaged_package",
  "delayed_shipment",
  "wrong_item",
  "wrong_destination",
  "payment_dispute",
  "customs_issue",
];

const PRIORITIES: Complaint["priority"][] = ["low", "medium", "high"];

const MANAGE_STATUSES: ComplaintStatus[] = [
  "open",
  "in_review",
  "awaiting_customer",
  "resolved",
  "closed",
];

const PRIORITY_TONE: Record<Complaint["priority"], "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export interface NewTicketValues {
  type: ComplaintType;
  trackingNumber: string;
  description: string;
  priority: Complaint["priority"];
  attachmentUrls: string[];
}

/** New ticket form modal. Handles attachment upload internally. */
export function NewTicketModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (values: NewTicketValues) => Promise<void>;
}) {
  const { error: toastError } = useToast();
  const [type, setType] = useState<ComplaintType>("damaged_package");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Complaint["priority"]>("medium");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setType("damaged_package");
    setTrackingNumber("");
    setDescription("");
    setPriority("medium");
    setFiles([]);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!description.trim()) {
      toastError("Please describe the issue.");
      return;
    }
    setSubmitting(true);
    try {
      const attachmentUrls = files.length
        ? await uploadFiles("complaints/tmp", files)
        : [];
      await onCreate({
        type,
        trackingNumber: trackingNumber.trim(),
        description: description.trim(),
        priority,
        attachmentUrls,
      });
      reset();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="New ticket"
      description="Raise a claim or complaint about a shipment."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
            Submit ticket
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" required>
          <Select value={type} onChange={(e) => setType(e.target.value as ComplaintType)}>
            {COMPLAINT_TYPES.map((t) => (
              <option key={t} value={t}>
                {COMPLAINT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Priority" required>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Complaint["priority"])}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {titleCase(p)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Shipment tracking number" hint="Optional." className="sm:col-span-2">
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="LCM-2606-AB12CD"
            className="font-mono"
          />
        </Field>

        <Field label="Description" required className="sm:col-span-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened…"
          />
        </Field>

        <Field label="Attachments" hint="Photos or documents (optional)." className="sm:col-span-2">
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
            className="block w-full text-sm text-navy-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-700 hover:file:bg-navy-200"
          />
          {files.length > 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
              <Paperclip className="h-3.5 w-3.5" /> {files.length} file
              {files.length > 1 ? "s" : ""} selected
            </p>
          )}
        </Field>
      </div>
    </Modal>
  );
}

/** Detail + manage/resolve modal. Management controls gated by `canManage`. */
export function ComplaintDetailModal({
  complaint,
  open,
  onClose,
  canManage,
  onAssign,
  onChangeStatus,
  onResolve,
}: {
  complaint: Complaint | null;
  open: boolean;
  onClose: () => void;
  canManage: boolean;
  onAssign: (c: Complaint) => Promise<void>;
  onChangeStatus: (c: Complaint, status: ComplaintStatus) => Promise<void>;
  onResolve: (c: Complaint, notes: string) => Promise<void>;
}) {
  const { error: toastError } = useToast();
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [busy, setBusy] = useState(false);

  if (!complaint) return null;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const isClosed = complaint.status === "resolved" || complaint.status === "closed";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={complaint.ticketNumber}
      description={COMPLAINT_TYPE_LABELS[complaint.type]}
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <KeyValue label="Status">
            <StatusBadge meta={COMPLAINT_STATUS_META[complaint.status]} />
          </KeyValue>
          <KeyValue label="Priority">
            <Badge tone={PRIORITY_TONE[complaint.priority]}>{titleCase(complaint.priority)}</Badge>
          </KeyValue>
          <KeyValue label="Customer">{complaint.customerName || "—"}</KeyValue>
          <KeyValue label="Tracking">
            {complaint.trackingNumber ? (
              <span className="font-mono">{complaint.trackingNumber}</span>
            ) : (
              "—"
            )}
          </KeyValue>
          <KeyValue label="Assigned to">{complaint.assignedToName || "Unassigned"}</KeyValue>
          <KeyValue label="Created">{formatDateTime(complaint.createdAt)}</KeyValue>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Description</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-navy-800">
            {complaint.description}
          </dd>
        </div>

        {complaint.attachmentUrls.length > 0 && (
          <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-navy-400">
              Attachments
            </dt>
            <ul className="space-y-1">
              {complaint.attachmentUrls.map((url, i) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" /> Attachment {i + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {complaint.resolutionNotes && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Resolution
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-emerald-800">
              {complaint.resolutionNotes}
            </dd>
          </div>
        )}

        {/* Management controls */}
        {canManage && (
          <div className="space-y-4 border-t border-navy-100 pt-4">
            <h3 className="text-sm font-semibold text-navy-900">Manage ticket</h3>

            <div className="flex flex-wrap items-end gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => run(() => onAssign(complaint))}
              >
                <UserCheck className="h-4 w-4" /> Assign to me
              </Button>

              <Field label="Status" className="min-w-[10rem]">
                <Select
                  value={complaint.status}
                  disabled={busy}
                  onChange={(e) =>
                    run(() => onChangeStatus(complaint, e.target.value as ComplaintStatus))
                  }
                >
                  {MANAGE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {COMPLAINT_STATUS_META[s].label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {!isClosed && (
              <div className="rounded-lg border border-navy-100 p-3">
                <Field label="Resolution notes" hint="Required to resolve the ticket.">
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the issue was resolved…"
                  />
                </Field>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="success"
                    size="sm"
                    loading={busy}
                    disabled={busy || !resolutionNotes.trim()}
                    onClick={() =>
                      run(async () => {
                        await onResolve(complaint, resolutionNotes.trim());
                        setResolutionNotes("");
                      })
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" /> Resolve ticket
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
