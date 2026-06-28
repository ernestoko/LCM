"use client";

import { CheckCircle2, Circle, MapPin } from "lucide-react";
import { SHIPMENT_STATUS_META } from "@/constants/statuses";
import { formatDateTime, fromNow } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { ShipmentStatus } from "@/types";

/**
 * Privacy-safe milestone, mirroring the public `/api/track` projection.
 * Only the three non-sensitive fields are accepted — `by`, `byName` and
 * `note` are intentionally absent.
 */
export interface PublicMilestone {
  status: ShipmentStatus;
  at: string;
  location?: string;
}

export interface PublicTimelineProps {
  timeline: PublicMilestone[];
  progressPercent: number;
  className?: string;
}

/**
 * Presentational, branded rendering of a shipment's public milestone history
 * plus a horizontal progress bar. No data fetching — props only.
 */
export function PublicTimeline({ timeline, progressPercent, className }: PublicTimelineProps) {
  // Most recent milestone first so customers see the latest update on top.
  const events = [...timeline].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  const clamped = Math.max(0, Math.min(100, Math.round(progressPercent)));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-navy-500">
          <span>Shipment progress</span>
          <span className="tabular-nums text-navy-700">{clamped}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-navy-100"
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Shipment progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-500 transition-all duration-500"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>

      {/* Milestone list */}
      {events.length === 0 ? (
        <p className="text-sm text-navy-400">No tracking updates yet.</p>
      ) : (
        <ol className="relative space-y-5 border-l border-navy-100 pl-6">
          {events.map((event, index) => {
            const meta = SHIPMENT_STATUS_META[event.status];
            const isLatest = index === 0;
            return (
              <li key={`${event.status}-${event.at}-${index}`} className="relative">
                <span
                  className={cn(
                    "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-white",
                    isLatest ? "text-brand-600" : "text-navy-300",
                  )}
                  aria-hidden
                >
                  {isLatest ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </span>
                <div className="flex flex-col gap-0.5">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isLatest ? "text-navy-900" : "text-navy-700",
                    )}
                  >
                    {meta?.label ?? event.status}
                  </p>
                  {event.location && (
                    <p className="flex items-center gap-1 text-xs text-navy-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {event.location}
                    </p>
                  )}
                  <p className="text-xs text-navy-400" title={formatDateTime(event.at)}>
                    {fromNow(event.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
