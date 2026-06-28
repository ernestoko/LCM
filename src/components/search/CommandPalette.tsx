"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { orderBy, limit, type QueryConstraint } from "firebase/firestore";
import { Search, Package, Users, FileText } from "lucide-react";
import { useCollection } from "@/lib/db/hooks";
import { COLLECTIONS } from "@/lib/db/collections";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils/cn";
import type { Customer, Shipment, Invoice } from "@/types";

// ---------------------------------------------------------------------------
// Public hook + module event — lets any component (e.g. a Topbar button) open
// the palette without prop drilling, by dispatching a window event.
// ---------------------------------------------------------------------------

const OPEN_EVENT = "lcm:open-search";

/** Returns `{ open }` — call `open()` to launch the command palette. */
export function useCommandPalette() {
  const open = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(OPEN_EVENT));
    }
  }, []);
  return { open };
}

// ---------------------------------------------------------------------------
// Result modelling
// ---------------------------------------------------------------------------

type ResultGroup = "customers" | "shipments" | "invoices";

interface SearchResult {
  group: ResultGroup;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const GROUP_META: Record<
  ResultGroup,
  { label: string; icon: typeof Search }
> = {
  customers: { label: "Customers", icon: Users },
  shipments: { label: "Shipments", icon: Package },
  invoices: { label: "Invoices", icon: FileText },
};

const GROUP_ORDER: ResultGroup[] = ["customers", "shipments", "invoices"];
const PER_GROUP_CAP = 6;

/** Case-insensitive substring match against any of the provided fields. */
function matches(query: string, ...fields: Array<string | undefined>): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return fields.some((f) => f != null && f.toLowerCase().includes(q));
}

// Read the 50 most recent of each collection; filter client-side.
const RECENT: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(50)];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const router = useRouter();
  const { can } = useAuth();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const canCustomers = can("customers.view");
  const canShipments = can("shipments.view");
  const canInvoices = can("invoices.view");
  const hasAnyAccess = canCustomers || canShipments || canInvoices;

  // --- Open/close wiring -------------------------------------------------
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ⌘K (mac) / Ctrl+K (win/linux) toggles the palette.
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpenEvent = () => setOpen(true);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, []);

  // Reset transient state each time the palette opens, and focus the input.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(0);
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = "";
    };
  }, [open]);

  // --- Data subscriptions (gated on permission AND open) -----------------
  // `enabled: false` means no Firestore listener is attached, so closed/no-
  // permission states never trigger reads (and never hit "permission denied").
  const { data: customers } = useCollection<Customer>(
    COLLECTIONS.customers,
    RECENT,
    { enabled: open && canCustomers },
  );
  const { data: shipments } = useCollection<Shipment>(
    COLLECTIONS.shipments,
    RECENT,
    { enabled: open && canShipments },
  );
  const { data: invoices } = useCollection<Invoice>(
    COLLECTIONS.invoices,
    RECENT,
    { enabled: open && canInvoices },
  );

  // --- Filtering ----------------------------------------------------------
  const q = query.trim();

  const grouped = useMemo<Record<ResultGroup, SearchResult[]>>(() => {
    const out: Record<ResultGroup, SearchResult[]> = {
      customers: [],
      shipments: [],
      invoices: [],
    };
    if (!q) return out;

    if (canCustomers) {
      out.customers = customers
        .filter((c) => matches(q, c.fullName, c.phone, c.customerCode, c.email))
        .slice(0, PER_GROUP_CAP)
        .map((c) => ({
          group: "customers",
          id: c.id,
          title: c.fullName,
          subtitle: [c.customerCode, c.phone].filter(Boolean).join(" · "),
          href: `/customers/${c.id}`,
        }));
    }

    if (canShipments) {
      out.shipments = shipments
        .filter((s) =>
          matches(q, s.trackingNumber, s.customerName, s.routeCode),
        )
        .slice(0, PER_GROUP_CAP)
        .map((s) => ({
          group: "shipments",
          id: s.id,
          title: s.trackingNumber,
          subtitle: [s.customerName, s.routeCode].filter(Boolean).join(" · "),
          href: `/shipments/${s.id}`,
        }));
    }

    if (canInvoices) {
      out.invoices = invoices
        .filter((inv) =>
          matches(q, inv.invoiceNumber, inv.customerName, inv.trackingNumber),
        )
        .slice(0, PER_GROUP_CAP)
        .map((inv) => ({
          group: "invoices",
          id: inv.id,
          title: inv.invoiceNumber,
          subtitle: [inv.customerName, inv.trackingNumber]
            .filter(Boolean)
            .join(" · "),
          href: `/invoices/${inv.id}`,
        }));
    }

    return out;
  }, [
    q,
    canCustomers,
    canShipments,
    canInvoices,
    customers,
    shipments,
    invoices,
  ]);

  // Flattened, ordered list used for keyboard navigation / indexing.
  const flat = useMemo<SearchResult[]>(
    () => GROUP_ORDER.flatMap((g) => grouped[g]),
    [grouped],
  );

  // Keep the highlight in bounds whenever results change.
  useEffect(() => {
    setHighlight((h) => (flat.length === 0 ? 0 : Math.min(h, flat.length - 1)));
  }, [flat.length]);

  // --- Navigation ---------------------------------------------------------
  const go = useCallback(
    (result: SearchResult | undefined) => {
      if (!result) return;
      close();
      router.push(result.href);
    },
    [close, router],
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flat.length > 0) setHighlight((h) => (h + 1) % flat.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flat.length > 0)
        setHighlight((h) => (h - 1 + flat.length) % flat.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      go(flat[highlight]);
    }
  };

  // Scroll the highlighted row into view.
  useEffect(() => {
    if (!open || flat.length === 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-result-index="${highlight}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open, flat.length]);

  if (!open) return null;

  const hasResults = flat.length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal
      aria-label="Search"
    >
      <div
        className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative z-10 flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-navy-100">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-navy-100 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-navy-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search customers, shipments, invoices…"
            className="w-full bg-transparent text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none"
            aria-label="Search query"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden shrink-0 rounded border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-500 sm:inline">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {!hasAnyAccess ? (
            <p className="px-4 py-8 text-center text-sm text-navy-500">
              No searchable records for your role.
            </p>
          ) : !q ? (
            <p className="px-4 py-8 text-center text-sm text-navy-500">
              Type to search…
            </p>
          ) : !hasResults ? (
            <p className="px-4 py-8 text-center text-sm text-navy-500">
              No results
            </p>
          ) : (
            GROUP_ORDER.map((group) => {
              const items = grouped[group];
              if (items.length === 0) return null;
              const { label, icon: Icon } = GROUP_META[group];
              return (
                <div key={group} className="mb-1 last:mb-0">
                  <div className="flex items-center gap-2 px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-navy-400">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <ul>
                    {items.map((result) => {
                      const index = flat.indexOf(result);
                      const active = index === highlight;
                      return (
                        <li key={`${result.group}-${result.id}`}>
                          <button
                            type="button"
                            data-result-index={index}
                            onMouseEnter={() => setHighlight(index)}
                            onClick={() => go(result)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 px-4 py-2 text-left",
                              active ? "bg-navy-50" : "hover:bg-navy-50/60",
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-navy-900">
                                {result.title}
                              </span>
                              {result.subtitle && (
                                <span className="block truncate text-xs text-navy-500">
                                  {result.subtitle}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-navy-100 px-4 py-2 text-[11px] text-navy-400">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-navy-200 bg-navy-50 px-1 py-0.5">
              ↑
            </kbd>
            <kbd className="rounded border border-navy-200 bg-navy-50 px-1 py-0.5">
              ↓
            </kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-navy-200 bg-navy-50 px-1 py-0.5">
              ↵
            </kbd>
            to open
          </span>
        </div>
      </div>
    </div>
  );
}
