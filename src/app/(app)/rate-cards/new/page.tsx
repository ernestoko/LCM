"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useActor } from "@/lib/auth/AuthProvider";
import { createRateCard, type NewRateCard } from "@/lib/db/repositories/rateCards";
import { PageHeader, useToast } from "@/components/ui";
import { RateCardForm, type RateCardFormData } from "@/components/rate-cards/RateCardForm";

export default function NewRateCardPage() {
  return (
    <RequirePermission permission="rates.create">
      <NewRateCard />
    </RequirePermission>
  );
}

function NewRateCard() {
  const router = useRouter();
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data: RateCardFormData) {
    setSubmitting(true);
    try {
      const payload: NewRateCard = { ...data, uploadedBy: actor.uid, uploadedByName: actor.name };
      await createRateCard(payload, actor);
      success("Rate card created as a draft. Submit it for Super Admin approval to activate.");
      router.push("/rate-cards");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create rate card.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/rate-cards" className="mb-3 inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" /> Back to rate cards
      </Link>
      <PageHeader
        title="New Rate Card"
        description="Define pilot pricing. The card is created as a draft and requires Liberty Super Admin approval to become active."
      />
      <div className="mt-6">
        <RateCardForm submitLabel="Create draft rate card" submitting={submitting} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
