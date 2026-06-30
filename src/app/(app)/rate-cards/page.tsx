"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Tags, ShieldCheck, Send, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import {
  useRateCards,
  submitRateCard,
  approveRateCard,
  rejectRateCard,
} from "@/lib/db/repositories/rateCards";
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
  Modal,
  Field,
  Textarea,
  InfoBanner,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from "@/components/ui";
import { RATE_CARD_STATUS_META, PRICING_TYPE_LABELS } from "@/constants/statuses";
import { formatDate } from "@/lib/utils/dates";
import { RateCardModal } from "@/components/rate-cards/RateCardModal";
import type { RateCard, RateCardStatus } from "@/types";

type FilterKey = "all" | "active" | "pending_approval" | "draft" | "expired";

const FILTER_STATUS: Record<Exclude<FilterKey, "all">, RateCardStatus[]> = {
  active: ["active"],
  pending_approval: ["pending_approval"],
  draft: ["draft"],
  expired: ["expired", "rejected"],
};

export default function RateCardsPage() {
  return (
    <RequirePermission permission="rates.view">
      <RateCards />
    </RequirePermission>
  );
}

function RateCards() {
  const { can } = useAuth();
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const { data: cards, loading, error } = useRateCards();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<RateCard | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<RateCard | null>(null);

  const canCreate = can("rates.create");
  const canApprove = can("rates.approve");

  const counts = useMemo(() => {
    const c = {
      all: cards.length,
      active: 0,
      pending_approval: 0,
      draft: 0,
      expired: 0,
    };
    for (const card of cards) {
      if (card.status === "active") c.active += 1;
      else if (card.status === "pending_approval") c.pending_approval += 1;
      else if (card.status === "draft") c.draft += 1;
      else if (card.status === "expired" || card.status === "rejected") c.expired += 1;
    }
    return c;
  }, [cards]);

  const filtered = useMemo(() => {
    if (filter === "all") return cards;
    return cards.filter((c) => FILTER_STATUS[filter].includes(c.status));
  }, [cards, filter]);

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "pending_approval", label: "Pending Approval", count: counts.pending_approval },
    { key: "draft", label: "Draft", count: counts.draft },
    { key: "expired", label: "Expired", count: counts.expired },
  ];

  async function withBusy(id: string, fn: () => Promise<void>, okMsg: string) {
    setBusyId(id);
    try {
      await fn();
      success(okMsg);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(reason: string) {
    if (!rejecting) return;
    const card = rejecting;
    setRejecting(null);
    await withBusy(card.id, () => rejectRateCard(card.id, reason, actor), `${card.name} rejected.`);
    if (selected?.id === card.id) setSelected(null);
  }

  return (
    <div>
      <PageHeader
        title="Rate Cards"
        description="Controlled pricing for the six-month pilot. Every change is approved and logged."
        actions={
          canCreate ? (
            <Link href="/rate-cards/new">
              <Button>
                <Plus className="h-4 w-4" /> New Rate Card
              </Button>
            </Link>
          ) : undefined
        }
      />

      <InfoBanner tone="info">
        <strong>Operations sets pricing during the pilot.</strong> New rate cards start as a{" "}
        <strong>DRAFT</strong>, are submitted for approval, and only a Liberty Super Admin can
        approve them to become <strong>ACTIVE</strong>. Active rate cards are immutable and every
        change is recorded in the card&apos;s change history.
      </InfoBanner>

      <div className="mt-6">
        <Tabs tabs={tabs} active={filter} onChange={(k) => setFilter(k as FilterKey)} />
      </div>

      <div className="mt-4">
        {loading ? (
          <LoadingState label="Loading rate cards…" />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No rate cards"
            description={
              filter !== "all"
                ? "No rate cards match this filter."
                : "Create the first rate card to define pilot pricing."
            }
            action={
              canCreate ? (
                <Link href="/rate-cards/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> New Rate Card
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
                  <TH>Name</TH>
                  <TH>Type</TH>
                  <TH>Route / Country</TH>
                  <TH>Effective</TH>
                  <TH>Status</TH>
                  <TH>Version</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((card: RateCard) => {
                  const busy = busyId === card.id;
                  return (
                    <TR key={card.id} onClick={() => setSelected(card)}>
                      <TD className="font-medium text-navy-800">{card.name}</TD>
                      <TD>
                        <Badge tone="neutral">{PRICING_TYPE_LABELS[card.pricingType]}</Badge>
                      </TD>
                      <TD className="text-xs">
                        {card.route ? (
                          <span className="font-mono">{card.route}</span>
                        ) : card.country ? (
                          card.country
                        ) : (
                          <span className="text-navy-400">All</span>
                        )}
                      </TD>
                      <TD className="text-xs text-navy-500">{formatDate(card.effectiveDate)}</TD>
                      <TD>
                        <StatusBadge meta={RATE_CARD_STATUS_META[card.status]} />
                      </TD>
                      <TD className="text-xs">v{card.version}</TD>
                      <TD className="text-right">
                        <div
                          className="flex justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(card.status === "draft" || card.status === "rejected") && canCreate && (
                            <Link href={`/rate-cards/${card.id}/edit`}>
                              <Button size="sm" variant="outline">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Button>
                            </Link>
                          )}
                          {card.status === "draft" && canCreate && (
                            <Button
                              size="sm"
                              variant="gold"
                              loading={busy}
                              disabled={busy}
                              onClick={() =>
                                withBusy(
                                  card.id,
                                  () => submitRateCard(card.id, actor),
                                  `${card.name} submitted for approval.`,
                                )
                              }
                            >
                              <Send className="h-3.5 w-3.5" /> Submit
                            </Button>
                          )}
                          {card.status === "pending_approval" && canApprove && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                loading={busy}
                                disabled={busy}
                                onClick={() =>
                                  withBusy(
                                    card.id,
                                    () => approveRateCard(card.id, actor),
                                    `${card.name} approved and activated.`,
                                  )
                                }
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={busy}
                                onClick={() => setRejecting(card)}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          {card.status === "active" && (
                            <Badge tone="success">
                              <ShieldCheck className="h-3.5 w-3.5" /> Locked
                            </Badge>
                          )}
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </Card>
        )}
      </div>

      <RateCardModal card={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />

      <RejectModal
        card={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}

function RejectModal({
  card,
  onClose,
  onConfirm,
}: {
  card: RateCard | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const { error: toastError } = useToast();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function close() {
    setReason("");
    onClose();
  }

  async function submit() {
    if (!reason.trim()) {
      toastError("A rejection reason is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={Boolean(card)}
      onClose={close}
      title="Reject rate card"
      description={card ? `Provide a reason for rejecting “${card.name}”.` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} loading={submitting} disabled={submitting}>
            Reject
          </Button>
        </>
      }
    >
      <Field label="Rejection reason" required>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this rate card is being rejected…"
          autoFocus
        />
      </Field>
    </Modal>
  );
}
