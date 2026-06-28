"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface DonutChartDatum {
  label: string;
  value: number;
  /** Concrete hex colour for this slice (required for a stable legend). */
  color: string;
}

const TRACK = "#e3eaf5"; // navy-100
const CENTER_VALUE = "#0f1b3d"; // navy-900
const CENTER_LABEL = "#5e7cb9"; // navy-500
const LEGEND_TEXT = "#3d5283"; // navy-700

export interface DonutChartProps {
  data: DonutChartDatum[];
  /** Square SVG viewBox size for the donut itself. */
  size?: number;
  /** Ring thickness as a fraction of the radius (0–1). */
  thickness?: number;
  /** Heading shown in the centre under the total. */
  centerLabel?: string;
  /** Format the centred total + legend values. */
  formatValue?: (v: number) => string;
  title?: string;
  className?: string;
  emptyLabel?: string;
}

/**
 * Dependency-free donut/pie chart (pure SVG) with a centred total and a legend.
 * Each slice exposes a `<title>` tooltip; responsive via `viewBox`.
 */
export function DonutChart({
  data,
  size = 240,
  thickness = 0.32,
  centerLabel = "Total",
  formatValue = (v) => `${v}`,
  title = "Donut chart",
  className,
  emptyLabel = "No data to display",
}: DonutChartProps) {
  const titleId = useId();

  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((sum, d) => sum + d.value, 0);

  if (slices.length === 0 || total <= 0) {
    return <ChartEmpty className={className} label={emptyLabel} />;
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 6;
  const stroke = radius * thickness;
  const r = radius - stroke / 2; // mid-line radius the stroke is centred on
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = slices.map((d, i) => {
    const fraction = d.value / total;
    const dash = fraction * circumference;
    const seg = {
      key: `${d.label}-${i}`,
      color: d.color,
      label: d.label,
      value: d.value,
      pct: fraction * 100,
      dashArray: `${dash} ${circumference - dash}`,
      // Negative offset so the first slice starts at 12 o'clock.
      dashOffset: -offset,
    };
    offset += dash;
    return seg;
  });

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-center", className)}>
      <svg
        role="img"
        aria-labelledby={titleId}
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-44 w-44 shrink-0 -rotate-90"
      >
        <title id={titleId}>{title}</title>

        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={TRACK} strokeWidth={stroke} />

        {/* Slices */}
        {segments.map((s) => (
          <circle
            key={s.key}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={s.dashArray}
            strokeDashoffset={s.dashOffset}
            strokeLinecap="butt"
          >
            <title>{`${s.label}: ${formatValue(s.value)} (${s.pct.toFixed(1)}%)`}</title>
          </circle>
        ))}

        {/* Centre text — counter-rotate to cancel the -90° group rotation */}
        <g transform={`rotate(90 ${cx} ${cy})`}>
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={22}
            fontWeight={700}
            fill={CENTER_VALUE}
          >
            {formatValue(total)}
          </text>
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill={CENTER_LABEL}
          >
            {centerLabel}
          </text>
        </g>
      </svg>

      {/* Legend */}
      <ul className="flex w-full flex-col gap-2">
        {segments.map((s) => (
          <li key={`legend-${s.key}`} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            <span className="flex-1 truncate" style={{ color: LEGEND_TEXT }}>
              {s.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-navy-900">
              {formatValue(s.value)}
            </span>
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-navy-400">
              {s.pct.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartEmpty({ className, label }: { className?: string; label: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[200px] w-full items-center justify-center rounded-lg border border-dashed border-navy-200 bg-navy-50/40 text-sm text-navy-400",
        className,
      )}
    >
      {label}
    </div>
  );
}

export default DonutChart;
