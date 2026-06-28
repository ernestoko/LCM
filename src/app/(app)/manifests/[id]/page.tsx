"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { isSeal } from "@/lib/auth/permissions";
import { useDocument } from "@/lib/db/hooks";
import { COLLECTIONS } from "@/lib/db/collections";
import {
  libertyApproveManifest,
  sealConfirmManifest,
  dispatchManifest,
} from "@/lib/db/repositories/manifests";
import {
  Button,
  Card,
  StatusBadge,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from "@/components/ui";
import { MANIFEST_STATUS_META, PAYMENT_STATUS_META } from "@/constants/statuses";
import { formatMoney, formatWeight } from "@/lib/utils/format";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import { notify } from "@/lib/notifications/service";
import type { Manifest } from "@/types";

export default function ManifestDetailPage() {
  return (
    <RequirePermission permission="manifests.view">
      <ManifestDetail />
    </RequirePermission>
  );
}

function ManifestDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can, role } = useAuth();
  const actor = useActor();
  const { success, error: toastError } = useToast();

  const { data: manifest, loading, error } = useDocument<Manifest>(COLLECTIONS.manifests, id);
  const [busy, setBusy] = useState<null | "approve" | "confirm" | "dispatch">(null);

  if (loading) return <LoadingState label="Loading manifest…" />;
  if (error) return <ErrorState message="Failed to load this manifest." />;
  if (!manifest) {
    return (
      <div>
        <BackLink />
        <EmptyState title="Manifest not found" description="This manifest may have been removed." />
      </div>
    );
  }

  const isApproved =
    manifest.status === "approved" ||
    manifest.status === "confirmed_by_seal" ||
    manifest.status === "dispatched";
  const isConfirmed =
    manifest.status === "confirmed_by_seal" || manifest.status === "dispatched";
  const isDispatched = manifest.status === "dispatched";

  const canApproveNow =
    can("manifests.approve") &&
    (manifest.status === "draft" || manifest.status === "pending_liberty_approval");
  const canConfirmNow = can("manifests.confirm") && manifest.status === "approved";
  const canDispatchNow =
    isApproved &&
    isConfirmed &&
    !isDispatched &&
    (can("manifests.approve") || isSeal(role));

  async function handleApprove() {
    setBusy("approve");
    try {
      await libertyApproveManifest(id, actor);
      success("Manifest approved by Liberty.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to approve manifest.");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirm() {
    setBusy("confirm");
    try {
      await sealConfirmManifest(id, actor);
      success("Manifest confirmed by SEAL.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to confirm manifest.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDispatch() {
    if (!manifest) return;
    setBusy("dispatch");
    try {
      await dispatchManifest(id, actor);
      // Best-effort dispatch notifications to each package's customer.
      await Promise.all(
        manifest.packages.map((pkg) =>
          notify(
            "dispatched",
            { name: pkg.customerName },
            { trackingNumber: pkg.trackingNumber, manifestNumber: manifest.manifestNumber },
            { shipmentId: pkg.shipmentId },
          ),
        ),
      ).catch(() => {});
      success("Manifest dispatched. Customers have been notified.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to dispatch manifest.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* Action bar — hidden when printing */}
      <div className="no-print">
        <BackLink />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-lg font-bold text-navy-900">{manifest.manifestNumber}</h1>
            <StatusBadge meta={MANIFEST_STATUS_META[manifest.status]} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            {canApproveNow && (
              <Button
                variant="primary"
                onClick={handleApprove}
                loading={busy === "approve"}
                disabled={busy !== null}
              >
                <CheckCircle2 className="h-4 w-4" /> Liberty Approve
              </Button>
            )}
            {canConfirmNow && (
              <Button
                variant="gold"
                onClick={handleConfirm}
                loading={busy === "confirm"}
                disabled={busy !== null}
              >
                <ShieldCheck className="h-4 w-4" /> SEAL Confirm
              </Button>
            )}
            {canDispatchNow && (
              <Button
                variant="success"
                onClick={handleDispatch}
                loading={busy === "dispatch"}
                disabled={busy !== null}
              >
                <Truck className="h-4 w-4" /> Dispatch
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Printable manifest document */}
      <Card className="print-container">
        <div className="p-6 sm:p-8">
          <header className="mb-6 border-b border-navy-200 pb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Liberty Cargo Movers
            </p>
            <h2 className="mt-1 text-2xl font-bold text-navy-900">Cargo Manifest</h2>
            <p className="mt-1 font-mono text-sm text-navy-600">{manifest.manifestNumber}</p>
          </header>

          <div className="mb-6 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <DocField label="Route" value={manifest.routeCode} mono />
            <DocField
              label="Origin → Destination"
              value={`${manifest.origin} → ${manifest.destination}`}
            />
            <DocField label="SEAL office" value={manifest.sealOffice ?? "—"} />
            <DocField label="Dispatch date" value={formatDate(manifest.dispatchDate)} />
            <DocField label="Expected arrival" value={formatDate(manifest.expectedArrivalDate)} />
            <DocField label="Status" value={MANIFEST_STATUS_META[manifest.status].label} />
            <DocField label="Prepared by" value={manifest.preparedByName ?? manifest.preparedBy} />
            <DocField
              label="Liberty approved by"
              value={
                manifest.libertyApprovedByName
                  ? `${manifest.libertyApprovedByName}${
                      manifest.libertyApprovedAt
                        ? ` · ${formatDateTime(manifest.libertyApprovedAt)}`
                        : ""
                    }`
                  : "Pending"
              }
            />
            <DocField
              label="SEAL confirmed by"
              value={
                manifest.sealConfirmedByName
                  ? `${manifest.sealConfirmedByName}${
                      manifest.sealConfirmedAt
                        ? ` · ${formatDateTime(manifest.sealConfirmedAt)}`
                        : ""
                    }`
                  : "Pending"
              }
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="border-y border-navy-200 text-left text-xs uppercase tracking-wide text-navy-500">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Tracking</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 text-right font-medium">Weight</th>
                  <th className="px-3 py-2 text-right font-medium">Declared value</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {manifest.packages.map((pkg, i) => (
                  <tr key={pkg.shipmentId}>
                    <td className="px-3 py-2.5 text-navy-500">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs font-medium text-navy-800">
                      {pkg.trackingNumber}
                    </td>
                    <td className="px-3 py-2.5 text-navy-800">{pkg.customerName}</td>
                    <td className="px-3 py-2.5 text-navy-600">{pkg.description}</td>
                    <td className="px-3 py-2.5 text-right text-navy-700">
                      {formatWeight(pkg.weightLb)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-navy-700">
                      {formatMoney(pkg.declaredValue)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge meta={PAYMENT_STATUS_META[pkg.paymentStatus]} />
                    </td>
                  </tr>
                ))}
                {manifest.packages.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-navy-400">
                      No packages on this manifest.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t-2 border-navy-300 text-sm font-semibold text-navy-900">
                <tr>
                  <td className="px-3 py-3" colSpan={4}>
                    Totals — {manifest.totalPackages} package
                    {manifest.totalPackages === 1 ? "" : "s"}
                  </td>
                  <td className="px-3 py-3 text-right">{formatWeight(manifest.totalWeightLb)}</td>
                  <td className="px-3 py-3 text-right">
                    {formatMoney(manifest.totalDeclaredValue)}
                  </td>
                  <td className="px-3 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/manifests"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
    >
      <ArrowLeft className="h-4 w-4" /> Back to manifests
    </Link>
  );
}

function DocField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className={`mt-0.5 text-sm text-navy-800${mono ? " font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}
