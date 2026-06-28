"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCommandPalette } from "./CommandPalette";

/**
 * Topbar search affordance. Dispatches the `lcm:open-search` window event
 * (via `useCommandPalette`) so the mounted <CommandPalette /> opens without
 * any prop drilling.
 */
export function SearchTrigger({ className }: { className?: string }) {
  const { open } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-sm text-navy-500 transition-colors hover:border-navy-300 hover:text-navy-700",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="ml-1 hidden items-center rounded border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-500 sm:inline-flex">
        ⌘K
      </kbd>
    </button>
  );
}
