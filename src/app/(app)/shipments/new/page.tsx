"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { ShipmentForm } from "@/components/shipments/ShipmentForm";
import { PageHeader, useToast } from "@/components/ui";
import { useActor } from "@/lib/auth/AuthProvider";
import { createShipment, type NewShipment } from "@/lib/db/repositories/shipments";

export default function NewShipmentPage() {
  const router = useRouter();
  const actor = useActor();
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data: NewShipment) {
    setSubmitting(true);
    try {
      const { id, trackingNumber } = await createShipment(data, actor);
      success(`Shipment created — ${trackingNumber}`);
      router.push(`/shipments/${id}`);
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to create shipment.");
      setSubmitting(false);
    }
  }

  return (
    <RequirePermission permission="shipments.create">
      <div>
        <Link
          href="/shipments"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to shipments
        </Link>
        <PageHeader
          title="New Shipment"
          description="Register a package and preview its price before it reaches operations intake."
        />
        <ShipmentForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </RequirePermission>
  );
}
