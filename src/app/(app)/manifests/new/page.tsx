"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Boxes } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useActor } from "@/lib/auth/AuthProvider";
import { useRoutes } from "@/lib/db/repositories/routes";
import { useShipments } from "@/lib/db/repositories/shipments";
import {
  createManifest,
  shipmentToManifestPackage,
} from "@/lib/db/repositories/manifests";
import { getCustomer } from "@/lib/db/repositories/customers";
import { notify } from "@/lib/notifications/service";
import { channelsForCustomer } from "@/lib/notifications/channels";
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Select,
  Checkbox,
  StatusBadge,
  Badge,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  InfoBanner,
  LoadingState,
  EmptyState,
  useToast,
} from "@/components/ui";
import { PAYMENT_STATUS_META } from "@/constants/statuses";
import { CONTAINER_SPECS, containerSpec, LOAD_TYPE_LABEL } from "@/constants/containers";
import { formatMoney, formatWeight, round2 } from "@/lib/utils/format";
import { round3 } from "@/lib/utils/cbm";
import type { CountryRoute, Shipment, ContainerType } from "@/types";

export default function NewManifestPage() {
  return (
    <RequirePermission permission="manifests.create">
      <NewManifest />
    </RequirePermission>
  );
}

function originDestination(route: CountryRoute): { origin: string; destination: string } {
  // Prefer explicit endpoints when present (required for "international" lanes).
  if (route.origin && route.destination) {
    return { origin: route.origin, destination: route.destination };
  }
  switch (route.direction) {
    case "usa_to_country":
      return { origin: "United States", destination: route.countryName };
    case "country_to_usa":
      return { origin: route.countryName, destination: "United States" };
    case "ghana_to_country":
      return { origin: "Ghana", destination: route.countryName };
    case "country_to_ghana":
      return { origin: route.countryName, destination: "Ghana" };
    default:
      return { origin: "United States", destination: route.countryName };
  }
}

function NewManifest() {
  const router = useRouter();
  const actor = useActor();
  const { success, error: toastError } = useToast();

  const { data: routes, loading: routesLoading } = useRoutes();
  const { data: shipments, loading: shipmentsLoading } = useShipments();

  const activeRoutes = useMemo(() => routes.filter((r) => r.status === "active"), [routes]);

  const [routeId, setRouteId] = useState("");
  const [sealOffice, setSealOffice] = useState("Operations Minnesota");
  const [dispatchDate, setDispatchDate] = useState("");
  const [expectedArrivalDate, setExpectedArrivalDate] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  // Sea container details (shown when sea shipments are selected).
  const [containerType, setContainerType] = useState<ContainerType>("40ft");
  const [loadType, setLoadType] = useState<"fcl" | "lcl">("lcl");
  const [containerNumber, setContainerNumber] = useState("");

  const route = useMemo(
    () => activeRoutes.find((r) => r.id === routeId),
    [activeRoutes, routeId],
  );

  // Shipments eligible for this route's manifest: matching route, not yet manifested.
  const eligible = useMemo(() => {
    if (!route) return [];
    return shipments.filter(
      (s) =>
        s.routeCode === route.code &&
        !s.manifestId &&
        s.status !== "cancelled" &&
        s.status !== "delivered",
    );
  }, [shipments, route]);

  const chosen = useMemo(
    () => eligible.filter((s) => selected[s.id]),
    [eligible, selected],
  );

  const totals = useMemo(
    () => ({
      count: chosen.length,
      weight: round2(chosen.reduce((sum, s) => sum + (s.weightLb || 0), 0)),
      declaredValue: round2(chosen.reduce((sum, s) => sum + (s.declaredValue || 0), 0)),
      cbm: round3(chosen.reduce((sum, s) => sum + (s.totalCbm || 0), 0)),
    }),
    [chosen],
  );
  const isSea = useMemo(() => chosen.some((s) => s.cargoType === "sea"), [chosen]);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectRoute(id: string) {
    setRouteId(id);
    setSelected({});
  }

  function paymentConfirmed(s: Shipment): boolean {
    return s.paymentStatus === "confirmed" || s.paymentStatus === "paid";
  }

  const unconfirmedSelected = chosen.some((s) => !paymentConfirmed(s));

  async function handleSubmit() {
    if (!route) {
      toastError("Select an active route first.");
      return;
    }
    if (chosen.length === 0) {
      toastError("Select at least one shipment to add to the manifest.");
      return;
    }
    setSubmitting(true);
    try {
      const { origin, destination } = originDestination(route);
      const packages = chosen.map((s) => shipmentToManifestPackage(s));
      const { id, manifestNumber } = await createManifest(
        {
          routeCode: route.code,
          origin,
          destination,
          sealOffice: sealOffice.trim() || undefined,
          dispatchDate: dispatchDate ? new Date(dispatchDate).toISOString() : undefined,
          expectedArrivalDate: expectedArrivalDate
            ? new Date(expectedArrivalDate).toISOString()
            : undefined,
          packages,
          // Sea container details (cargoType + totalCbm are derived from packages).
          ...(isSea
            ? {
                loadType,
                containerType,
                capacityCbm: containerSpec(containerType).capacityCbm,
                containerNumber: containerNumber.trim() || undefined,
              }
            : {}),
          status: "draft",
        },
        actor,
      );
      // Best-effort: tell each sender their package is now on a manifest. This is
      // the primary path shipments reach "added_to_manifest", so the notification
      // must fire here (the manual status path on the shipment page also covers it).
      await Promise.all(
        chosen.map(async (s) => {
          const customer = s.customerId ? await getCustomer(s.customerId) : null;
          await notify(
            "added_to_manifest",
            {
              userId: customer?.id,
              name: s.customerName,
              email: customer?.email,
              phone: customer?.phone,
            },
            { trackingNumber: s.trackingNumber, manifestNumber, route: s.routeCode },
            { shipmentId: s.id, channels: channelsForCustomer(customer) },
          );
        }),
      ).catch(() => {});
      success(`Manifest created with ${packages.length} package${packages.length === 1 ? "" : "s"}.`);
      router.push(`/manifests/${id}`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create manifest.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href="/manifests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to manifests
      </Link>
      <PageHeader
        title="New Manifest"
        description="Group payment-confirmed packages onto a route for dispatch. Requires Liberty approval and Operations confirmation before it can move."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Manifest details" subtitle="Choose an approved, active route." />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <Field label="Route" required className="sm:col-span-2">
              {routesLoading ? (
                <LoadingState label="Loading routes…" />
              ) : activeRoutes.length === 0 ? (
                <InfoBanner tone="warning">
                  No active routes yet. A country must be onboarded and Liberty-approved before it
                  can carry a manifest.
                </InfoBanner>
              ) : (
                <Select value={routeId} onChange={(e) => selectRoute(e.target.value)}>
                  <option value="">Select a route…</option>
                  {activeRoutes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.countryName} · {r.code}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            {route && (
              <Field label="Origin → Destination" className="sm:col-span-2">
                <p className="text-sm font-medium text-navy-800">
                  {originDestination(route).origin} → {originDestination(route).destination}
                </p>
              </Field>
            )}

            <Field label="Operations hub">
              <Input
                value={sealOffice}
                onChange={(e) => setSealOffice(e.target.value)}
                placeholder="Operations Minnesota"
              />
            </Field>
            <div />
            <Field label="Dispatch date">
              <Input
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
              />
            </Field>
            <Field label="Expected arrival date">
              <Input
                type="date"
                value={expectedArrivalDate}
                onChange={(e) => setExpectedArrivalDate(e.target.value)}
              />
            </Field>
          </CardBody>
        </Card>

        {route && (
          <Card>
            <CardHeader
              title="Eligible shipments"
              subtitle={`Packages on ${route.code} not yet on a manifest.`}
            />
            {shipmentsLoading ? (
              <LoadingState label="Loading shipments…" />
            ) : eligible.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Boxes}
                  title="No eligible shipments"
                  description="There are no un-manifested packages for this route right now."
                />
              </div>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH />
                    <TH>Tracking</TH>
                    <TH>Customer</TH>
                    <TH>Description</TH>
                    <TH>Weight</TH>
                    <TH>Declared value</TH>
                    <TH>Payment</TH>
                  </TR>
                </THead>
                <TBody>
                  {eligible.map((s) => {
                    const confirmed = paymentConfirmed(s);
                    return (
                      <TR key={s.id} onClick={() => toggle(s.id)}>
                        <TD>
                          <Checkbox
                            checked={Boolean(selected[s.id])}
                            onChange={() => toggle(s.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TD>
                        <TD className="font-mono text-xs font-medium text-brand-600">
                          {s.trackingNumber}
                        </TD>
                        <TD className="font-medium text-navy-800">{s.customerName}</TD>
                        <TD className="text-xs text-navy-600">
                          {s.packageDescription ||
                            s.items.map((i) => i.itemType).join(", ") ||
                            "—"}
                        </TD>
                        <TD className="text-navy-700">{formatWeight(s.weightLb)}</TD>
                        <TD className="text-navy-700">{formatMoney(s.declaredValue ?? 0)}</TD>
                        <TD>
                          <span className="inline-flex items-center gap-1.5">
                            <StatusBadge meta={PAYMENT_STATUS_META[s.paymentStatus]} />
                            {!confirmed && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </span>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Card>
        )}

        {route && isSea && (
          <Card>
            <CardHeader
              title="Sea container"
              subtitle="Container details for this ocean-freight load (FCL or LCL groupage)."
            />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Load type">
                  <Select
                    value={loadType}
                    onChange={(e) => setLoadType(e.target.value as "fcl" | "lcl")}
                  >
                    <option value="lcl">{LOAD_TYPE_LABEL.lcl}</option>
                    <option value="fcl">{LOAD_TYPE_LABEL.fcl}</option>
                  </Select>
                </Field>
                <Field label="Container size">
                  <Select
                    value={containerType}
                    onChange={(e) => setContainerType(e.target.value as ContainerType)}
                  >
                    {CONTAINER_SPECS.map((c) => (
                      <option key={c.type} value={c.type}>
                        {c.label} · {c.capacityCbm} CBM
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Container number" hint="Optional">
                  <Input
                    value={containerNumber}
                    onChange={(e) => setContainerNumber(e.target.value)}
                    placeholder="e.g. MSKU 123456-7"
                  />
                </Field>
              </div>
              {(() => {
                const cap = containerSpec(containerType).capacityCbm;
                const pct = cap > 0 ? Math.min(100, Math.round((totals.cbm / cap) * 100)) : 0;
                const over = totals.cbm > cap;
                return (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-navy-600">Container fill</span>
                      <span className="font-semibold text-navy-900">
                        {totals.cbm} / {cap} CBM ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy-100">
                      <div
                        className={`h-full rounded-full ${over ? "bg-red-500" : "bg-brand-600"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {over && (
                      <p className="mt-1 text-xs text-red-600">
                        Exceeds container capacity — split across containers or upsize.
                      </p>
                    )}
                  </div>
                );
              })()}
            </CardBody>
          </Card>
        )}

        {route && (
          <Card>
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-navy-400">Packages</p>
                  <p className="text-lg font-semibold text-navy-900">{totals.count}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-navy-400">
                    {isSea ? "Total volume" : "Total weight"}
                  </p>
                  <p className="text-lg font-semibold text-navy-900">
                    {isSea ? `${totals.cbm} CBM` : formatWeight(totals.weight)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-navy-400">Declared value</p>
                  <p className="text-lg font-semibold text-navy-900">
                    {formatMoney(totals.declaredValue)}
                  </p>
                </div>
                {unconfirmedSelected && (
                  <Badge tone="warning">
                    <AlertTriangle className="h-3.5 w-3.5" /> Some selected packages are not payment
                    confirmed
                  </Badge>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting || totals.count === 0}
              >
                Create manifest
              </Button>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
