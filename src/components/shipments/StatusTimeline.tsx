"use client";

import { Check, Circle, MapPin } from "lucide-react";
import type { Shipment, ShipmentStatusEvent } from "@/types";
import { SHIPMENT_STATUS_META, shipmentStatusOrder } from "@/constants/statuses";
import { fromNow } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

/**
 * Vertical timeline of a shipment's status history plus a horizontal stepper
 * over the canonical lifecycle highlighting the current stage.
 */
export function StatusTimeline({ shipment }: { shipment: Shipment }) {
  const history: ShipmentStatusEvent[] = [...(shipment.statusHistory ?? [])].sort(
    (a, b) => b.at.localeCompare(a.at),
  );

  // Lifecycle for this shipment's mode of carriage (air or sea).
  const order = shipmentStatusOrder(shipment.cargoType);

  // Position of the current status within the ordered lifecycle. Statuses that
  // are off the linear path (issue_reported / cancelled) clamp to 0.
  const currentIndex = order.indexOf(shipment.status);

  return (
    <div className="space-y-6">
      {/* Horizontal stepper over the canonical lifecycle */}
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-center gap-0">
          {order.map((status, idx) => {
            const meta = SHIPMENT_STATUS_META[status];
            const isDone = currentIndex >= 0 && idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isLast = idx === order.length - 1;
            return (
              <li key={status} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5 px-1">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full ring-2 transition-colors",
                      isCurrent
                        ? "bg-brand-600 text-white ring-brand-200"
                        : isDone
                          ? "bg-emerald-500 text-white ring-emerald-200"
                          : "bg-white text-navy-300 ring-navy-200",
                    )}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isCurrent ? (
                      <Circle className="h-2.5 w-2.5 fill-current" />
                    ) : (
                      <Circle className="h-2.5 w-2.5" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "max-w-[5.5rem] text-center text-[10px] font-medium leading-tight",
                      isCurrent
                        ? "text-brand-700"
                        : isDone
                          ? "text-navy-700"
                          : "text-navy-400",
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                {!isLast && (
                  <span
                    className={cn(
                      "mx-0.5 mb-5 h-0.5 w-8 rounded-full",
                      isDone ? "bg-emerald-400" : "bg-navy-100",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Vertical history timeline */}
      {history.length === 0 ? (
        <p className="text-sm text-navy-400">No status history recorded yet.</p>
      ) : (
        <ul className="space-y-0">
          {history.map((event, idx) => {
            const meta = SHIPMENT_STATUS_META[event.status];
            const isLatest = idx === 0;
            const isLast = idx === history.length - 1;
            return (
              <li key={`${event.status}-${event.at}-${idx}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "mt-1 flex h-3 w-3 shrink-0 rounded-full ring-2",
                      isLatest
                        ? "bg-brand-600 ring-brand-200"
                        : "bg-navy-300 ring-navy-100",
                    )}
                  />
                  {!isLast && <span className="my-1 w-px flex-1 bg-navy-100" />}
                </div>
                <div className={cn("pb-5", isLast && "pb-0")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isLatest ? "text-navy-900" : "text-navy-700",
                      )}
                    >
                      {meta?.label ?? event.status}
                    </span>
                    <span className="text-xs text-navy-400">{fromNow(event.at)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-navy-500">
                    {event.byName ? `by ${event.byName}` : "by system"}
                  </p>
                  {event.location && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-navy-500">
                      <MapPin className="h-3 w-3" /> {event.location}
                    </p>
                  )}
                  {event.note && (
                    <p className="mt-1 text-xs text-navy-600">{event.note}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
