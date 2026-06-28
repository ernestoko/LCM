"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useManifests } from "@/lib/db/repositories/manifests";
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
  StatusBadge,
  Tabs,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { MANIFEST_STATUS_META } from "@/constants/statuses";
import { formatWeight } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import type { Manifest, ManifestStatus } from "@/types";

type FilterKey = "all" | "draft" | "pending" | "approved" | "dispatched";

function statusGroup(status: ManifestStatus): Exclude<FilterKey, "all"> | "other" {
  if (status === "draft") return "draft";
  if (status === "pending_liberty_approval") return "pending";
  if (status === "approved" || status === "confirmed_by_seal") return "approved";
  if (status === "dispatched") return "dispatched";
  return "other";
}

export default function ManifestsPage() {
  return (
    <RequirePermission permission="manifests.view">
      <ManifestsList />
    </RequirePermission>
  );
}

function ManifestsList() {
  const router = useRouter();
  const { can } = useAuth();
  const { data, loading, error } = useManifests();

  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const c = { all: data.length, draft: 0, pending: 0, approved: 0, dispatched: 0 };
    for (const m of data) {
      const g = statusGroup(m.status);
      if (g !== "other") c[g] += 1;
    }
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    if (filter === "all") return data;
    return data.filter((m) => statusGroup(m.status) === filter);
  }, [data, filter]);

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "draft", label: "Draft", count: counts.draft },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "dispatched", label: "Dispatched", count: counts.dispatched },
  ];

  return (
    <div>
      <PageHeader
        title="Manifests"
        description="A package only moves once it's on an approved, SEAL-confirmed manifest."
        actions={
          can("manifests.create") ? (
            <Link href="/manifests/new">
              <Button>
                <Plus className="h-4 w-4" /> New Manifest
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Tabs tabs={tabs} active={filter} onChange={(k) => setFilter(k as FilterKey)} />

      <div className="mt-4">
        {loading ? (
          <LoadingState label="Loading manifests…" />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No manifests found"
            description={
              filter !== "all"
                ? "Try a different filter."
                : "Build a manifest to group payment-confirmed packages for dispatch."
            }
            action={
              can("manifests.create") ? (
                <Link href="/manifests/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> New Manifest
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Manifest #</TH>
                  <TH>Route</TH>
                  <TH>Origin → Destination</TH>
                  <TH>Packages</TH>
                  <TH>Total weight</TH>
                  <TH>Status</TH>
                  <TH>Dispatch date</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((m: Manifest) => (
                  <TR key={m.id} onClick={() => router.push(`/manifests/${m.id}`)}>
                    <TD>
                      <Link
                        href={`/manifests/${m.id}`}
                        className="font-mono text-xs font-medium text-brand-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {m.manifestNumber}
                      </Link>
                    </TD>
                    <TD className="text-xs">{m.routeCode}</TD>
                    <TD className="text-xs text-navy-600">
                      {m.origin} → {m.destination}
                    </TD>
                    <TD className="font-medium text-navy-800">{m.totalPackages}</TD>
                    <TD className="text-navy-700">{formatWeight(m.totalWeightLb)}</TD>
                    <TD>
                      <StatusBadge meta={MANIFEST_STATUS_META[m.status]} />
                    </TD>
                    <TD className="text-xs text-navy-400">{formatDate(m.dispatchDate)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
