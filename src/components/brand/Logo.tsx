import { cn } from "@/lib/utils/cn";

/** Liberty Cargo Movers mark — a stylised cargo container + ship motion lines. */
export function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect width="48" height="48" rx="11" fill="#0f1b3d" />
      <path d="M9 30h30l-3 6H12l-3-6Z" fill="#c78d2c" />
      <rect x="14" y="14" width="20" height="14" rx="2" fill="#fff" />
      <path d="M14 19h20M19 14v14M24 14v14M29 14v14" stroke="#0f1b3d" strokeWidth="1.4" />
      <path d="M8 24h4M36 24h4" stroke="#598bff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LogoWordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo size={32} />
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-bold text-navy-900">Liberty Cargo Movers</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gold-600">
            Logistics Platform
          </p>
        </div>
      )}
    </div>
  );
}
