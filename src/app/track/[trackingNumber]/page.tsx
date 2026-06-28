"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MapPin, PackageX, Search } from "lucide-react";
import { LogoWordmark } from "@/components/brand/Logo";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import { PublicTimeline } from "@/components/tracking/PublicTimeline";
import { SHIPMENT_STATUS_META } from "@/constants/statuses";
import { formatDate } from "@/lib/utils/dates";
import type { ShipmentStatus } from "@/types";

/** Privacy-safe milestone, mirroring the `/api/track` projection. */
interface PublicMilestone {
  status: ShipmentStatus;
  at: string;
  location?: string;
}

/** Minimal, privacy-safe shipment shape returned by `/api/track`. */
interface PublicShipment {
  trackingNumber: string;
  status: ShipmentStatus;
  routeCode: string;
  originCountry: string;
  destinationCountry: string;
  recipientName: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  progressPercent: number;
  timeline: PublicMilestone[];
}

type TrackResponse =
  | { ok: true; shipment: PublicShipment }
  | { ok: false; error: string };

export default function TrackResultPage() {
  const params = useParams<{ trackingNumber: string }>();
  const router = useRouter();
  const trackingNumber = decodeURIComponent(params.trackingNumber ?? "");

  const [shipment, setShipment] = useState<PublicShipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setShipment(null);

    (async () => {
      try {
        const res = await fetch(`/api/track/${encodeURIComponent(trackingNumber)}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as TrackResponse;
        if (!active) return;
        if (data.ok) {
          setShipment(data.shipment);
        } else {
          setError(data.error);
        }
      } catch {
        if (active) setError("We couldn't reach the tracking service. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [trackingNumber]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = query.trim().toUpperCase();
    if (!next) return;
    setQuery("");
    router.push(`/track/${encodeURIComponent(next)}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-navy-50">
      {/* Header */}
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/track" aria-label="Liberty & Liberty Logistics — Track">
            <LogoWordmark />
          </Link>
          <Link href="/login" className="text-sm font-medium text-brand-600 hover:underline">
            Staff sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {/* Track-another search */}
        <form onSubmit={onSearch} className="mb-6 flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Track another number…"
            aria-label="Track another shipment"
            autoComplete="off"
            autoCapitalize="characters"
            className="font-mono"
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" />
            Track
          </Button>
        </form>

        {loading ? (
          <Card>
            <CardBody>
              <LoadingState label={`Looking up ${trackingNumber}…`} />
            </CardBody>
          </Card>
        ) : error || !shipment ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={PackageX}
                title="Shipment not found"
                description={
                  error ??
                  "We couldn't find a shipment for that tracking number. Check the number and try again."
                }
                action={
                  <Link href="/track">
                    <Button variant="outline">Back to tracking</Button>
                  </Link>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-5">
            {/* Status summary */}
            <Card>
              <CardBody className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-navy-400">
                      Tracking number
                    </p>
                    <p className="font-mono text-lg font-semibold text-navy-900">
                      {shipment.trackingNumber}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <StatusBadge
                      meta={SHIPMENT_STATUS_META[shipment.status]}
                      fallback={shipment.status}
                    />
                  </div>
                </div>

                {/* Route */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-700">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  <span className="font-medium">{shipment.originCountry}</span>
                  <ArrowRight className="h-4 w-4 text-navy-400" />
                  <span className="font-medium">{shipment.destinationCountry}</span>
                  <span className="ml-auto font-mono text-xs text-navy-400">
                    {shipment.routeCode}
                  </span>
                </div>

                {/* Key facts */}
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Fact label="Recipient" value={shipment.recipientName} />
                  <Fact
                    label="Expected delivery"
                    value={formatDate(shipment.expectedDeliveryDate)}
                  />
                  <Fact
                    label="Delivered"
                    value={
                      shipment.actualDeliveryDate
                        ? formatDate(shipment.actualDeliveryDate)
                        : "—"
                    }
                  />
                </dl>
              </CardBody>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader title="Tracking history" subtitle="Latest updates first" />
              <CardBody>
                <PublicTimeline
                  timeline={shipment.timeline}
                  progressPercent={shipment.progressPercent}
                />
              </CardBody>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-100 bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-navy-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Liberty &amp; Liberty Logistics. All rights reserved.</p>
          <Link href="/login" className="font-medium text-navy-500 hover:text-brand-600">
            Staff sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-navy-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-navy-800">{value}</dd>
    </div>
  );
}
