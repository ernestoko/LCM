"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Package } from "lucide-react";
import { useDocument } from "@/lib/db/hooks";
import { COLLECTIONS } from "@/lib/db/collections";
import { Button, LoadingState, EmptyState } from "@/components/ui";
import { Waybill } from "@/components/shipments/Waybill";
import type { Shipment } from "@/types";

export default function ShipmentLabelPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: shipment, loading } = useDocument<Shipment>(COLLECTIONS.shipments, id);

  if (loading) return <LoadingState label="Loading shipping label…" />;

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
        <EmptyState
          icon={Package}
          title="Shipment not found"
          description="This shipment may have been removed or the link is incorrect."
        />
      </div>
    );
  }

  return (
    <div>
      {/* Action bar — hidden when printing */}
      <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/shipments/${shipment.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to shipment
        </Link>
        <Button variant="primary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print label
        </Button>
      </div>

      {/* Centered printable waybill */}
      <div className="flex justify-center">
        <Waybill shipment={shipment} />
      </div>
    </div>
  );
}
