"use client";

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const base =
  // placeholder is navy-600 (≥4.5:1 on white) so hint examples stay legible, not the
  // washed-out gray that fails WCAG AA; disabled text may sit lighter (state is exempt).
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-600 " +
  "focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-200 disabled:bg-navy-50 disabled:text-navy-400";

// suppressHydrationWarning: form-filler / autofill browser extensions inject
// attributes (e.g. `fdprocessedid`) onto inputs before React hydrates, which
// would otherwise trip a hydration mismatch. It only affects this element's
// own attributes, so real prop mismatches elsewhere are still caught.
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} suppressHydrationWarning className={cn(base, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} suppressHydrationWarning className={cn(base, "min-h-[80px] resize-y", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} suppressHydrationWarning className={cn(base, "appearance-none bg-no-repeat pr-8", className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export function Label({
  children,
  htmlFor,
  required,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1 block text-xs font-medium text-navy-700", className)}>
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-navy-600">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm text-navy-700", className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-navy-300 text-brand-600 focus:ring-brand-400"
        {...props}
      />
      {label}
    </label>
  );
}
