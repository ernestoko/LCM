import {
  ShieldCheck,
  Store,
  Building2,
  Globe,
  Users,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const BADGES = [
  { icon: Store, label: "Online Sellers" },
  { icon: Building2, label: "Importers & Exporters" },
  { icon: Boxes, label: "E-commerce Brands" },
  { icon: Users, label: "Families & Individuals" },
  { icon: Globe, label: "Freight Forwarders" },
  { icon: ShieldCheck, label: "Trusted Worldwide" },
];

export function LogoCloud({ className }: { className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-navy-500">
        Trusted by businesses &amp; individuals shipping worldwide
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:gap-x-12">
        {BADGES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="inline-flex items-center gap-2.5 text-navy-400 transition-colors hover:text-navy-700"
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
