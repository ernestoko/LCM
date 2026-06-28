import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ProcessStep = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function ProcessSteps({
  steps,
  className,
}: {
  steps: ProcessStep[];
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.title} className="relative flex flex-col items-start">
            {/* Connector line to the next step (desktop only) */}
            {!isLast ? (
              <span
                className="absolute left-12 top-6 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-brand-200 to-navy-100 lg:block"
                aria-hidden="true"
              />
            ) : null}
            <div className="relative z-10 flex items-center gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white shadow-card">
                <Icon className="h-6 w-6" aria-hidden="true" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-white ring-2 ring-white">
                  {i + 1}
                </span>
              </div>
            </div>
            <h3 className="mt-5 text-base font-bold text-navy-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">{step.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
