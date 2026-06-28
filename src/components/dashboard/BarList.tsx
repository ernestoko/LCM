import { cn } from "@/lib/utils/cn";

export function BarList({
  items,
  className,
}: {
  items: { label: string; value: number; tone?: string }[];
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className={cn("space-y-2.5", className)}>
      {items.length === 0 && <p className="text-sm text-navy-400">No data yet.</p>}
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-navy-600">{item.label}</span>
            <span className="font-semibold text-navy-800">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-navy-100">
            <div
              className={cn("h-full rounded-full", item.tone ?? "bg-brand-500")}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
