"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-200 bg-white py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-200"
      />
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-navy-100">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
            active === t.key
              ? "text-brand-600"
              : "text-navy-500 hover:text-navy-800",
          )}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className="ml-1.5 rounded-full bg-navy-100 px-1.5 py-0.5 text-xs text-navy-600">
              {t.count}
            </span>
          )}
          {active === t.key && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
          )}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name, src, className }: { name?: string; src?: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? "avatar"} className={cn("h-9 w-9 rounded-full object-cover", className)} />;
  }
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-navy-800">{children || "—"}</dd>
    </div>
  );
}
