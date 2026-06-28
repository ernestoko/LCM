import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-base font-bold text-navy-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{description}</p>
      </div>
    </div>
  );
}
