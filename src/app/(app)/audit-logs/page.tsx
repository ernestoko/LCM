"use client";

import { useMemo, useState } from "react";
import type { AuditAction } from "@/types";
import type { BadgeTone } from "@/constants/statuses";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuditLogs } from "@/lib/db/repositories/auditLogs";
import {
  PageHeader,
  Card,
  CardBody,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  Badge,
  SearchInput,
  Select,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui";
import { ROLE_LABELS } from "@/constants/roles";
import { formatDateTime } from "@/lib/utils/dates";
import { truncate } from "@/lib/utils/format";

const ACTION_LABELS: Record<AuditAction, string> = {
  rate_change: "Rate Change",
  rate_approved: "Rate Approved",
  rate_rejected: "Rate Rejected",
  shipment_create: "Shipment Created",
  shipment_edit: "Shipment Edited",
  shipment_status_change: "Status Changed",
  payment_update: "Payment Update",
  manifest_approval: "Manifest Approval",
  manifest_create: "Manifest Created",
  user_login: "User Login",
  user_create: "User Created",
  record_delete: "Record Deleted",
  record_cancel: "Record Cancelled",
  admin_override: "Admin Override",
  settings_change: "Settings Changed",
  data_export: "Data Export",
  customer_create: "Customer Created",
  invoice_generate: "Invoice Generated",
};

const ACTION_TONE: Partial<Record<AuditAction, BadgeTone>> = {
  rate_approved: "success",
  rate_rejected: "danger",
  record_delete: "danger",
  record_cancel: "danger",
  admin_override: "warning",
  settings_change: "purple",
  data_export: "info",
  user_create: "info",
  user_login: "neutral",
};

const ACTIONS = Object.keys(ACTION_LABELS) as AuditAction[];

function valueText(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  return String(v);
}

function AuditLogViewer() {
  const { data: logs, loading, error } = useAuditLogs(300);

  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | AuditAction>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (!q) return true;
      const haystack = [
        log.userName,
        log.userId,
        ACTION_LABELS[log.action] ?? log.action,
        log.action,
        log.entity,
        log.entityId,
        log.field,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [logs, query, actionFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of platform actions, newest first."
      />

      <Card>
        <CardBody className="p-0">
          <div className="flex flex-col gap-3 border-b border-navy-100 p-4 sm:flex-row sm:items-center">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search user, action or entity…"
              className="flex-1"
            />
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as "all" | AuditAction)}
              className="sm:w-56"
            >
              <option value="all">All actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a]}
                </option>
              ))}
            </Select>
          </div>

          {loading ? (
            <LoadingState label="Loading audit logs…" />
          ) : error ? (
            <div className="p-5">
              <ErrorState message={error.message} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No matching entries"
                description="Adjust the search or action filter."
              />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Time</TH>
                  <TH>User</TH>
                  <TH>Action</TH>
                  <TH>Entity</TH>
                  <TH>Field</TH>
                  <TH>Old → New</TH>
                  <TH>Reason</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((log) => (
                  <TR key={log.id}>
                    <TD className="whitespace-nowrap text-xs text-navy-500">
                      {formatDateTime(log.at)}
                    </TD>
                    <TD>
                      <div className="font-medium text-navy-900">{log.userName ?? "System"}</div>
                      {log.userRole && (
                        <div className="text-xs text-navy-400">
                          {ROLE_LABELS[log.userRole] ?? log.userRole}
                        </div>
                      )}
                    </TD>
                    <TD>
                      <Badge tone={ACTION_TONE[log.action] ?? "neutral"}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </TD>
                    <TD>
                      <div className="text-navy-700">{log.entity}</div>
                      {log.entityId && (
                        <div className="font-mono text-xs text-navy-400">
                          {truncate(log.entityId, 16)}
                        </div>
                      )}
                    </TD>
                    <TD className="text-navy-600">{log.field ?? "—"}</TD>
                    <TD className="text-xs text-navy-600">
                      {log.oldValue == null && log.newValue == null ? (
                        "—"
                      ) : (
                        <span>
                          <span className="text-navy-400">
                            {truncate(valueText(log.oldValue), 20)}
                          </span>
                          <span className="mx-1 text-navy-300">→</span>
                          <span className="font-medium text-navy-800">
                            {truncate(valueText(log.newValue), 20)}
                          </span>
                        </span>
                      )}
                    </TD>
                    <TD className="text-navy-600">
                      {log.reason ? truncate(log.reason, 40) : "—"}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <RequirePermission permission="audit.view">
      <AuditLogViewer />
    </RequirePermission>
  );
}
