"use client";

import { Plane, Ship } from "lucide-react";
import type { CargoType } from "@/types";
import { cn } from "@/lib/utils/cn";

const OPTIONS: {
  type: CargoType;
  label: string;
  desc: string;
  Icon: typeof Plane;
}[] = [
  { type: "air", label: "Air Cargo", desc: "Fastest — priced by weight.", Icon: Plane },
  {
    type: "sea",
    label: "Sea Cargo",
    desc: "Economical for bulky goods — priced by volume (CBM) or by drums & boxes.",
    Icon: Ship,
  },
];

/** Two-card chooser for a shipment's mode of carriage (air vs sea). */
export function CargoTypeChoice({
  value,
  onChange,
}: {
  value: CargoType;
  onChange: (v: CargoType) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map(({ type, label, desc, Icon }) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          aria-pressed={value === type}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
            value === type
              ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-200"
              : "border-navy-200 hover:border-brand-300 hover:bg-navy-50",
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              value === type ? "bg-brand-600 text-white" : "bg-navy-100 text-navy-500",
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-navy-900">{label}</span>
            <span className="mt-0.5 block text-xs text-navy-500">{desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
