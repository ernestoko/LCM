"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Trap Tab focus within the dialog for keyboard + screen-reader users.
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (items.length === 0) {
          e.preventDefault();
          panel.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !panel.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Move focus into the dialog on open.
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Restore focus to whatever launched the modal.
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-xs" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl outline-hidden sm:rounded-2xl",
          widths[size],
        )}
      >
        <div className="flex items-start justify-between border-b border-navy-100 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-navy-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-navy-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-navy-400 hover:bg-navy-100 hover:text-navy-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-navy-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
