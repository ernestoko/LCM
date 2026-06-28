"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { PilotRecommendation } from "@/types";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { isLiberty } from "@/lib/auth/permissions";
import { useShipments } from "@/lib/db/repositories/shipments";
import { useInvoices } from "@/lib/db/repositories/invoices";
import { usePayments } from "@/lib/db/repositories/payments";
import { useComplaints } from "@/lib/db/repositories/complaints";
import { useRoutes } from "@/lib/db/repositories/routes";
import { usePilotTracker, savePilotTracker } from "@/lib/db/repositories/settings";
import { computeLibertyMetrics } from "@/lib/analytics/metrics";
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  StatCard,
  Field,
  Input,
  Textarea,
  Select,
  Badge,
  KeyValue,
  LoadingState,
  InfoBanner,
  useToast,
} from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/utils/format";
import { formatDate, daysBetween } from "@/lib/utils/dates";
import type { BadgeTone } from "@/constants/statuses";

const RECOMMENDATION_LABELS: Record<PilotRecommendation, string> = {
  continue: "Continue",
  renegotiate: "Renegotiate",
  expand: "Expand",
  terminate: "Terminate",
  undecided: "Undecided",
};

const RECOMMENDATION_TONE: Record<PilotRecommendation, BadgeTone> = {
  continue: "success",
  renegotiate: "warning",
  expand: "info",
  terminate: "danger",
  undecided: "neutral",
};

const RECOMMENDATIONS: PilotRecommendation[] = [
  "continue",
  "renegotiate",
  "expand",
  "terminate",
  "undecided",
];

/** Convert an ISO timestamp to the yyyy-MM-dd value an <input type=date> needs. */
function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : "";
}

/** Convert a yyyy-MM-dd input value back into an ISO timestamp. */
function fromDateInput(value: string): string {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : new Date().toISOString();
}

function PilotTrackerView() {
  const { role, can } = useAuth();
  const actor = useActor();
  const { success, error: errorToast } = useToast();

  const { pilot, loading: lPilot } = usePilotTracker();
  const { data: shipments, loading: lShip } = useShipments();
  const { data: invoices, loading: lInv } = useInvoices();
  const { data: payments, loading: lPay } = usePayments();
  const { data: complaints, loading: lCom } = useComplaints();
  const { data: routes, loading: lRoute } = useRoutes();

  const loading = lPilot || lShip || lInv || lPay || lCom || lRoute;

  // settings.manage covers super admins; Liberty operators are also allowed.
  const canEdit = can("settings.manage") || isLiberty(role);

  const currency = invoices[0]?.currency ?? "USD";

  const metrics = useMemo(
    () => computeLibertyMetrics(shipments, invoices, payments, complaints, routes),
    [shipments, invoices, payments, complaints, routes],
  );

  // --- Editable form state -------------------------------------------------
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeRoutes, setActiveRoutes] = useState("");
  const [countriesOnboarded, setCountriesOnboarded] = useState("");
  const [recommendation, setRecommendation] = useState<PilotRecommendation>("undecided");
  const [recommendationNotes, setRecommendationNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStartDate(toDateInput(pilot.startDate));
    setEndDate(toDateInput(pilot.endDate));
    setActiveRoutes(pilot.activeRoutes.join(", "));
    setCountriesOnboarded(pilot.countriesOnboarded.join(", "));
    setRecommendation(pilot.recommendation);
    setRecommendationNotes(pilot.recommendationNotes ?? "");
    setNotes(pilot.notes ?? "");
  }, [pilot]);

  // --- Elapsed progress ----------------------------------------------------
  const totalDays = daysBetween(pilot.startDate, pilot.endDate) ?? 0;
  const elapsedDays = Math.max(0, daysBetween(pilot.startDate, new Date().toISOString()) ?? 0);
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const progress = totalDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : 0;

  function parseList(value: string): string[] {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await savePilotTracker(
        {
          startDate: fromDateInput(startDate),
          endDate: fromDateInput(endDate),
          activeRoutes: parseList(activeRoutes),
          countriesOnboarded: parseList(countriesOnboarded),
          recommendation,
          recommendationNotes: recommendationNotes.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        actor,
      );
      success("Pilot tracker updated.");
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Failed to save pilot tracker.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading pilot tracker…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="6-Month Outsourcing Tracker"
        description="Live pilot performance and the SEAL partnership recommendation."
        actions={
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to Reports
            </Button>
          </Link>
        }
      />

      {/* Elapsed-time progress */}
      <Card>
        <CardHeader
          title="Pilot Timeline"
          subtitle={`${formatDate(pilot.startDate)} → ${formatDate(pilot.endDate)}`}
          action={
            <Badge tone={RECOMMENDATION_TONE[pilot.recommendation]}>
              {RECOMMENDATION_LABELS[pilot.recommendation]}
            </Badge>
          }
        />
        <CardBody>
          <div className="mb-2 flex items-center justify-between text-xs text-navy-500">
            <span>{elapsedDays} days elapsed</span>
            <span>{remainingDays} days remaining</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-navy-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-sm font-semibold text-navy-900">{progress}% complete</p>
        </CardBody>
      </Card>

      {/* Live metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Shipments"
          value={formatNumber(metrics.totalShipments)}
          icon="Package"
          tone="brand"
        />
        <StatCard
          label="Delivered"
          value={formatNumber(metrics.deliveredShipments)}
          icon="CheckCircle2"
          tone="emerald"
        />
        <StatCard
          label="Delivery Rate"
          value={`${metrics.deliveryRate}%`}
          icon="Gauge"
          tone="gold"
          hint={`${metrics.delayedShipments} delayed`}
        />
        <StatCard
          label="Liberty Earnings"
          value={formatMoney(metrics.libertyEarnings, currency)}
          icon="TrendingUp"
          tone="violet"
        />
        <StatCard
          label="Countries Onboarded"
          value={formatNumber(pilot.countriesOnboarded.length)}
          icon="Globe"
          tone="navy"
        />
        <StatCard
          label="Active Routes"
          value={formatNumber(pilot.activeRoutes.length)}
          icon="Route"
          tone="amber"
        />
      </div>

      {canEdit ? (
        <Card>
          <CardHeader
            title="Update Tracker"
            subtitle="Adjust the pilot window, footprint and recommendation."
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Start Date" htmlFor="pilot-start">
                <Input
                  id="pilot-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
              <Field label="End Date" htmlFor="pilot-end">
                <Input
                  id="pilot-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Field>
            </div>

            <Field
              label="Active Routes"
              htmlFor="pilot-routes"
              hint="Comma-separated route codes, e.g. USA-GHANA, USA-NIGERIA"
            >
              <Input
                id="pilot-routes"
                value={activeRoutes}
                onChange={(e) => setActiveRoutes(e.target.value)}
                placeholder="USA-GHANA, USA-NIGERIA"
              />
            </Field>

            <Field
              label="Countries Onboarded"
              htmlFor="pilot-countries"
              hint="Comma-separated country names, e.g. Ghana, Nigeria"
            >
              <Input
                id="pilot-countries"
                value={countriesOnboarded}
                onChange={(e) => setCountriesOnboarded(e.target.value)}
                placeholder="Ghana, Nigeria"
              />
            </Field>

            <Field label="Recommendation" htmlFor="pilot-reco">
              <Select
                id="pilot-reco"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as PilotRecommendation)}
              >
                {RECOMMENDATIONS.map((r) => (
                  <option key={r} value={r}>
                    {RECOMMENDATION_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Recommendation Notes" htmlFor="pilot-reco-notes">
              <Textarea
                id="pilot-reco-notes"
                value={recommendationNotes}
                onChange={(e) => setRecommendationNotes(e.target.value)}
                placeholder="Rationale for the recommendation…"
              />
            </Field>

            <Field label="Notes" htmlFor="pilot-notes">
              <Textarea
                id="pilot-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="General observations on the pilot…"
              />
            </Field>
          </CardBody>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" /> Save Tracker
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Pilot Summary" subtitle="Read-only — managed by Liberty." />
          <CardBody className="space-y-4">
            <InfoBanner tone="info">
              You can view the pilot tracker but only Liberty can update it.
            </InfoBanner>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <KeyValue label="Active Routes">
                {pilot.activeRoutes.length ? pilot.activeRoutes.join(", ") : "—"}
              </KeyValue>
              <KeyValue label="Countries Onboarded">
                {pilot.countriesOnboarded.length ? pilot.countriesOnboarded.join(", ") : "—"}
              </KeyValue>
              <KeyValue label="Recommendation">
                <Badge tone={RECOMMENDATION_TONE[pilot.recommendation]}>
                  {RECOMMENDATION_LABELS[pilot.recommendation]}
                </Badge>
              </KeyValue>
              <KeyValue label="Recommendation Notes">{pilot.recommendationNotes || "—"}</KeyValue>
              <KeyValue label="Notes">{pilot.notes || "—"}</KeyValue>
            </dl>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default function PilotTrackerPage() {
  return (
    <RequirePermission permission="reports.view">
      <PilotTrackerView />
    </RequirePermission>
  );
}
