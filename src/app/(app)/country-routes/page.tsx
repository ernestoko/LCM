"use client";

import { useMemo, useState } from "react";
import { Plus, Globe2, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { isSeal } from "@/lib/auth/permissions";
import {
  useRoutes,
  createRoute,
  sealConfirmRoute,
  libertyApproveRoute,
  setRouteStatus,
  type NewRoute,
} from "@/lib/db/repositories/routes";
import {
  PageHeader,
  Button,
  Card,
  CardBody,
  Badge,
  StatusBadge,
  KeyValue,
  Modal,
  Field,
  Input,
  Select,
  Textarea,
  Checkbox,
  InfoBanner,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from "@/components/ui";
import {
  ROUTE_STATUS_META,
  ROUTE_DIRECTION_LABELS,
  PRICING_TYPE_LABELS,
} from "@/constants/statuses";
import { formatMoney } from "@/lib/utils/format";
import type {
  CountryRoute,
  RouteDirection,
  PricingType,
  CurrencyCode,
} from "@/types";

const DIRECTIONS: RouteDirection[] = [
  "usa_to_country",
  "country_to_usa",
  "ghana_to_country",
  "country_to_ghana",
  "international",
];
const PRICING_TYPES: PricingType[] = [
  "weight_based",
  "item_based",
  "service_fee",
  "special_handling",
];
const CURRENCIES: CurrencyCode[] = ["USD", "GHS", "NGN", "EUR", "GBP"];

export default function CountryRoutesPage() {
  return (
    <RequirePermission permission="routes.view">
      <CountryRoutes />
    </RequirePermission>
  );
}

function CountryRoutes() {
  const { can, role } = useAuth();
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const { data: routes, loading, error } = useRoutes();

  const [onboarding, setOnboarding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  return (
    <div>
      <PageHeader
        title="Country Routes"
        description="Countries are onboarded gradually. A route stays in DRAFT until Liberty approves and activates it."
        actions={
          can("routes.create") ? (
            <Button onClick={() => setOnboarding(true)}>
              <Plus className="h-4 w-4" /> Onboard Country
            </Button>
          ) : undefined
        }
      />

      <InfoBanner tone="info">
        New country routes start as <strong>DRAFT</strong>. Operations confirms operational readiness,
        then Liberty approves to activate the route for live shipments.
      </InfoBanner>

      <div className="mt-6">
        {loading ? (
          <LoadingState label="Loading routes…" />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : routes.length === 0 ? (
          <EmptyState
            icon={Globe2}
            title="No routes yet"
            description="Onboard a country to begin building out the pilot network."
            action={
              can("routes.create") ? (
                <Button size="sm" onClick={() => setOnboarding(true)}>
                  <Plus className="h-4 w-4" /> Onboard Country
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                isSealUser={isSeal(role)}
                canApprove={can("routes.approve")}
                busy={busyId === route.id}
                onSealConfirm={() =>
                  withBusy(
                    route.id,
                    () => sealConfirmRoute(route.id, actor),
                    `${route.countryName} confirmed by Operations.`,
                  )
                }
                onLibertyApprove={() =>
                  withBusy(
                    route.id,
                    () => libertyApproveRoute(route.id, actor),
                    `${route.countryName} approved and activated.`,
                  )
                }
                onToggleStatus={(status) =>
                  withBusy(
                    route.id,
                    () => setRouteStatus(route.id, status, actor),
                    `${route.countryName} ${status === "active" ? "activated" : "suspended"}.`,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      <OnboardModal
        open={onboarding}
        onClose={() => setOnboarding(false)}
        onCreate={async (data) => {
          await createRoute(data, actor);
          success(`${data.countryName} onboarded as a draft route.`);
          setOnboarding(false);
        }}
      />
    </div>
  );
}

function RouteCard({
  route,
  isSealUser,
  canApprove,
  busy,
  onSealConfirm,
  onLibertyApprove,
  onToggleStatus,
}: {
  route: CountryRoute;
  isSealUser: boolean;
  canApprove: boolean;
  busy: boolean;
  onSealConfirm: () => void;
  onLibertyApprove: () => void;
  onToggleStatus: (status: CountryRoute["status"]) => void;
}) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-navy-900">{route.countryName}</h3>
            <p className="font-mono text-xs text-navy-500">{route.code}</p>
          </div>
          <StatusBadge meta={ROUTE_STATUS_META[route.status]} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KeyValue label="Direction">{ROUTE_DIRECTION_LABELS[route.direction]}</KeyValue>
          <KeyValue label="Pricing">{PRICING_TYPE_LABELS[route.pricingType]}</KeyValue>
          <KeyValue label="Default rate">
            {route.defaultRate != null ? formatMoney(route.defaultRate, route.currency) : "—"}
          </KeyValue>
          <KeyValue label="Transit">
            {route.transitTimeDays != null ? `${route.transitTimeDays} days` : "—"}
          </KeyValue>
          <KeyValue label="Service fee">
            {route.serviceFeeApplies ? (
              <Badge tone="info">Applies</Badge>
            ) : (
              <Badge tone="neutral">Waived</Badge>
            )}
          </KeyValue>
          <KeyValue label="Country code">
            <span className="font-mono">{route.countryCode}</span>
          </KeyValue>
        </div>

        <div className="flex flex-wrap gap-2">
          {route.sealConfirmed ? (
            <Badge tone="success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Operations confirmed
            </Badge>
          ) : (
            <Badge tone="warning">
              <AlertTriangle className="h-3.5 w-3.5" /> Operations pending
            </Badge>
          )}
          {route.libertyApproved ? (
            <Badge tone="success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Liberty approved
            </Badge>
          ) : (
            <Badge tone="warning">
              <AlertTriangle className="h-3.5 w-3.5" /> Liberty pending
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-navy-100 pt-3">
          {isSealUser && !route.sealConfirmed && (
            <Button size="sm" variant="gold" onClick={onSealConfirm} loading={busy} disabled={busy}>
              <ShieldCheck className="h-4 w-4" /> Operations Confirm
            </Button>
          )}
          {canApprove && !route.libertyApproved && (
            <Button
              size="sm"
              variant="primary"
              onClick={onLibertyApprove}
              loading={busy}
              disabled={busy}
            >
              <CheckCircle2 className="h-4 w-4" /> Liberty Approve &amp; Activate
            </Button>
          )}
          {canApprove && route.libertyApproved && route.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleStatus("suspended")}
              loading={busy}
              disabled={busy}
            >
              Suspend
            </Button>
          )}
          {canApprove && route.libertyApproved && route.status === "suspended" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleStatus("active")}
              loading={busy}
              disabled={busy}
            >
              Activate
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

interface OnboardFormState {
  countryName: string;
  countryCode: string;
  direction: RouteDirection;
  /** Explicit endpoints — only used (and shown) for "international" lanes. */
  origin: string;
  destination: string;
  pricingType: PricingType;
  defaultRate: string;
  currency: CurrencyCode;
  transitTimeDays: string;
  prohibitedItems: string;
  requiredDocuments: string;
  customsProcess: string;
  deliveryCoverage: string;
  serviceFeeApplies: boolean;
}

const INITIAL_FORM: OnboardFormState = {
  countryName: "",
  countryCode: "",
  direction: "usa_to_country",
  origin: "",
  destination: "",
  pricingType: "weight_based",
  defaultRate: "",
  currency: "USD",
  transitTimeDays: "",
  prohibitedItems: "",
  requiredDocuments: "",
  customsProcess: "",
  deliveryCoverage: "",
  serviceFeeApplies: true,
};

function toList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function OnboardModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: NewRoute) => Promise<void>;
}) {
  const { error: toastError } = useToast();
  const [form, setForm] = useState<OnboardFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const isInternational = form.direction === "international";

  const code = useMemo(() => {
    const slug = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");
    if (isInternational) {
      const o = slug(form.origin);
      const d = slug(form.destination);
      return o && d ? `${o}-${d}` : "";
    }
    const name = slug(form.countryName);
    return name ? `USA-${name}` : "";
  }, [isInternational, form.origin, form.destination, form.countryName]);

  function set<K extends keyof OnboardFormState>(key: K, value: OnboardFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function close() {
    setForm(INITIAL_FORM);
    onClose();
  }

  async function handleSubmit() {
    if (!form.countryName.trim() || !form.countryCode.trim()) {
      toastError("Country name and ISO code are required.");
      return;
    }
    if (isInternational && (!form.origin.trim() || !form.destination.trim())) {
      toastError("International routes need both an origin and a destination country.");
      return;
    }
    setSubmitting(true);
    try {
      const data: NewRoute = {
        code,
        countryName: form.countryName.trim(),
        countryCode: form.countryCode.trim().toUpperCase(),
        direction: form.direction,
        ...(isInternational
          ? { origin: form.origin.trim(), destination: form.destination.trim() }
          : {}),
        pricingType: form.pricingType,
        defaultRate: form.defaultRate ? Number(form.defaultRate) : undefined,
        currency: form.currency,
        transitTimeDays: form.transitTimeDays ? Number(form.transitTimeDays) : undefined,
        prohibitedItems: toList(form.prohibitedItems),
        requiredDocuments: toList(form.requiredDocuments),
        customsProcess: form.customsProcess.trim() || undefined,
        deliveryCoverage: form.deliveryCoverage.trim() || undefined,
        serviceFeeApplies: form.serviceFeeApplies,
      };
      await onCreate(data);
      setForm(INITIAL_FORM);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to onboard country.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Onboard a country"
      description="The route is created as a DRAFT until Liberty approves and activates it."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
            Create draft route
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country name" required>
          <Input
            value={form.countryName}
            onChange={(e) => set("countryName", e.target.value)}
            placeholder="Ghana"
          />
        </Field>
        <Field label="ISO-2 country code" required hint="e.g. GH">
          <Input
            value={form.countryCode}
            onChange={(e) => set("countryCode", e.target.value.toUpperCase())}
            placeholder="GH"
            maxLength={2}
          />
        </Field>

        <Field label="Route code" hint="Derived from the country name.">
          <Input value={code} readOnly className="font-mono" placeholder="USA-COUNTRY" />
        </Field>
        <Field label="Direction" required>
          <Select
            value={form.direction}
            onChange={(e) => set("direction", e.target.value as RouteDirection)}
          >
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {ROUTE_DIRECTION_LABELS[d]}
              </option>
            ))}
          </Select>
        </Field>

        {isInternational && (
          <>
            <Field label="Origin country" required hint="Where cargo ships from">
              <Input
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                placeholder="China"
              />
            </Field>
            <Field label="Destination country" required hint="Where cargo is delivered">
              <Input
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                placeholder="Nigeria"
              />
            </Field>
          </>
        )}

        <Field label="Pricing type" required>
          <Select
            value={form.pricingType}
            onChange={(e) => set("pricingType", e.target.value as PricingType)}
          >
            {PRICING_TYPES.map((p) => (
              <option key={p} value={p}>
                {PRICING_TYPE_LABELS[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Currency" required>
          <Select
            value={form.currency}
            onChange={(e) => set("currency", e.target.value as CurrencyCode)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Default rate" hint="Per lb for weight-based routes.">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.defaultRate}
            onChange={(e) => set("defaultRate", e.target.value)}
            placeholder="11.57"
          />
        </Field>
        <Field label="Transit time (days)">
          <Input
            type="number"
            min={0}
            value={form.transitTimeDays}
            onChange={(e) => set("transitTimeDays", e.target.value)}
            placeholder="21"
          />
        </Field>

        <Field label="Prohibited items" hint="Comma-separated." className="sm:col-span-2">
          <Input
            value={form.prohibitedItems}
            onChange={(e) => set("prohibitedItems", e.target.value)}
            placeholder="Firearms, Liquids, Perishables"
          />
        </Field>
        <Field label="Required documents" hint="Comma-separated." className="sm:col-span-2">
          <Input
            value={form.requiredDocuments}
            onChange={(e) => set("requiredDocuments", e.target.value)}
            placeholder="Commercial invoice, Packing list"
          />
        </Field>

        <Field label="Customs process" className="sm:col-span-2">
          <Textarea
            value={form.customsProcess}
            onChange={(e) => set("customsProcess", e.target.value)}
            placeholder="Describe the customs clearance steps for this country…"
          />
        </Field>
        <Field label="Delivery coverage" className="sm:col-span-2">
          <Textarea
            value={form.deliveryCoverage}
            onChange={(e) => set("deliveryCoverage", e.target.value)}
            placeholder="Cities / regions covered for last-mile delivery…"
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            label="Service fee applies on this route"
            checked={form.serviceFeeApplies}
            onChange={(e) => set("serviceFeeApplies", e.target.checked)}
          />
        </div>
      </div>
    </Modal>
  );
}
