import { cn } from "@/lib/utils/cn";
import { StatCounter } from "./StatCounter";

export type Stat = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
};

export function StatsBand({
  stats,
  dark = false,
  className,
}: {
  stats: Stat[];
  dark?: boolean;
  className?: string;
}) {
  const dividerColor = dark ? "lg:before:bg-white/15" : "lg:before:bg-navy-200";
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            "relative",
            // Subtle divider between stats on wider screens.
            i > 0
              ? cn(
                  "lg:before:absolute lg:before:-left-5 lg:before:top-2 lg:before:h-12 lg:before:w-px lg:before:content-['']",
                  dividerColor,
                )
              : "",
          )}
        >
          <StatCounter
            value={stat.value}
            suffix={stat.suffix}
            prefix={stat.prefix}
            label={stat.label}
            dark={dark}
          />
        </div>
      ))}
    </div>
  );
}
