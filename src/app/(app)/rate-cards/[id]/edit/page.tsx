"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useActor } from "@/lib/auth/AuthProvider";
import { useRateCards, updateRateCard } from "@/lib/db/repositories/rateCards";
import { PageHeader, InfoBanner, LoadingState, ErrorState, useToast } from "@/components/ui";
import { RateCardForm, cardToFormState, type RateCardFormData } from "@/components/rate-cards/RateCardForm";

export default function EditRateCardPage() {
  return (
    <RequirePermission permission="rates.create">
      <EditRateCard />
    </RequirePermission>
  );
}

function EditRateCard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const { data: cards, loading, error } = useRateCards();
  const [submitting, setSubmitting] = useState(false);

  const card = cards.find((c) => c.id === id);

  const back = (
    <Link href="/rate-cards" className="mb-3 inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-800">
      <ArrowLeft className="h-4 w-4" /> Back to rate cards
    </Link>
  );

  if (loading) return <LoadingState label="Loading rate card…" />;
  if (error) return <ErrorState message="Failed to load rate card." />;
  if (!card) {
    return (
      <div>
        {back}
        <ErrorState message="Rate card not found." />
      </div>
    );
  }

  // Active/expired cards are immutable — edit a draft/new version instead.
  if (card.status === "active" || card.status === "expired") {
    return (
      <div>
        {back}
        <PageHeader title={card.name} description="This rate card is locked." />
        <InfoBanner tone="warning">
          Active rate cards are immutable. Create a new rate card to change pricing, then submit it
          for approval.
        </InfoBanner>
      </div>
    );
  }

  async function handleSubmit(data: RateCardFormData) {
    setSubmitting(true);
    try {
      await updateRateCard(card!.id, data, actor, "Edited from the rate-card editor");
      success("Rate card updated. Submit it for Super Admin approval to activate.");
      router.push("/rate-cards");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to update rate card.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      {back}
      <PageHeader
        title={`Edit: ${card.name}`}
        description={`Status: ${card.status} · version ${card.version}. Editing keeps it a draft pending approval.`}
      />
      <div className="mt-6">
        <RateCardForm
          initial={cardToFormState(card)}
          submitLabel="Save changes"
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
