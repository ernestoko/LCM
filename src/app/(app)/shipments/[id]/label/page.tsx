"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Package, Minus, Plus } from "lucide-react";
import { useDocument } from "@/lib/db/hooks";
import { COLLECTIONS } from "@/lib/db/collections";
import { Button, LoadingState, EmptyState } from "@/components/ui";
import { PackageLabel } from "@/components/shipments/PackageLabel";
import type { Shipment } from "@/types";

export default function ShipmentLabelsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: shipment, loading } = useDocument<Shipment>(COLLECTIONS.shipments, id);
  // null = follow the shipment's recorded piece count; a number overrides it.
  const [override, setOverride] = useState<number | null>(null);

  if (loading) return <LoadingState label="Loading package labels…" />;

  if (!shipment) {
    return (
      <div>
        <div className="no-print">
          <Link
            href="/shipments"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to shipments
          </Link>
        </div>
        <EmptyState icon={Package} title="Shipment not found" description="This shipment may have been removed." />
      </div>
    );
  }

  const recorded = Math.max(1, shipment.pieces ?? 1);
  const total = Math.min(99, Math.max(1, override ?? recorded));

  return (
    <div>
      {/* Each label prints on its own 4x6 page with no margin (thermal-friendly). */}
      <style dangerouslySetInnerHTML={{ __html: "@media print { @page { size: 4in 6in; margin: 0; } }" }} />

      {/* Action bar — hidden when printing */}
      <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/shipments/${shipment.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to shipment
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy-600">Labels</span>
            <div className="inline-flex items-center rounded-lg border border-navy-200">
              <button
                type="button"
                onClick={() => setOverride(Math.max(1, total - 1))}
                className="px-2.5 py-2 text-navy-500 hover:bg-navy-50 disabled:opacity-40"
                disabled={total <= 1}
                aria-label="One fewer label"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-10 px-2 text-center text-sm font-semibold text-navy-900">{total}</span>
              <button
                type="button"
                onClick={() => setOverride(Math.min(99, total + 1))}
                className="px-2.5 py-2 text-navy-500 hover:bg-navy-50 disabled:opacity-40"
                disabled={total >= 99}
                aria-label="One more label"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-navy-400">({recorded} on record)</span>
          </div>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print {total} label{total === 1 ? "" : "s"}
          </Button>
        </div>
      </div>

      {/* One numbered label per package — each on its own print page. */}
      <div className="flex flex-col items-center gap-6">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ breakAfter: i < total - 1 ? "page" : "auto" }}>
            <PackageLabel shipment={shipment} pieceNumber={i + 1} totalPieces={total} />
          </div>
        ))}
      </div>
    </div>
  );
}
