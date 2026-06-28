"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface BarChartDatum {
  label: string;
  value: number;
  /** Concrete hex colour for the bar; falls back to brand-500. */
  color?: string;
}

const DEFAULT_BAR = "#b6881a"; // brand-500 (gold)
const AXIS = "#cdd9ec"; // navy-200
const GRID = "#e3eaf5"; // navy-100
const LABEL = "#3d5283"; // navy-700
const VALUE = "#0f1b3d"; // navy-900

export interface BarChartProps {
  data: BarChartDatum[];
  /** Internal SVG coordinate width/height (the viewBox), scales to container. */
  width?: number;
  height?: number;
  /** Format a raw value into a display string (axis + tooltip). */
  formatValue?: (v: number) => string;
  /** Accessible chart title used by the SVG `<title>`. */
  title?: string;
  className?: string;
  emptyLabel?: string;
}

/**
 * Dependency-free, responsive vertical bar chart rendered as pure SVG.
 * Scales via `viewBox` + `preserveAspectRatio`; bars expose a `<title>` tooltip.
 */
export function BarChart({
  data,
  width = 640,
  height = 320,
  formatValue = (v) => `${v}`,
  title = "Bar chart",
  className,
  emptyLabel = "No data to display",
}: BarChartProps) {
  const titleId = useId();

  if (data.length === 0) {
    return <ChartEmpty className={className} label={emptyLabel} />;
  }

  const padTop = 24;
  const padBottom = 56;
  const padLeft = 48;
  const padRight = 16;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baselineY = padTop + plotH;

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  // Round the axis ceiling up to a "nice" number for readable gridlines.
  const niceMax = niceCeil(maxValue);
  const scaleY = (v: number) => (niceMax > 0 ? (v / niceMax) * plotH : 0);

  const slot = plotW / data.length;
  const barW = Math.min(slot * 0.62, 72);

  const ticks = 4;
  const gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
    const t = i / ticks;
    return { y: padTop + plotH - t * plotH, value: niceMax * t };
  });

  return (
    <svg
      role="img"
      aria-labelledby={titleId}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn("h-full w-full", className)}
    >
      <title id={titleId}>{title}</title>

      {/* Horizontal gridlines + y-axis value labels */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={padLeft}
            x2={width - padRight}
            y1={g.y}
            y2={g.y}
            stroke={i === 0 ? AXIS : GRID}
            strokeWidth={1}
          />
          <text
            x={padLeft - 8}
            y={g.y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={11}
            fill={LABEL}
          >
            {formatValue(roundForAxis(g.value))}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const h = scaleY(d.value);
        const x = padLeft + i * slot + (slot - barW) / 2;
        const y = baselineY - h;
        const fill = d.color ?? DEFAULT_BAR;
        return (
          <g key={`${d.label}-${i}`}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 0)}
              rx={4}
              fill={fill}
            >
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </rect>
            {/* Value label above the bar */}
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill={VALUE}
            >
              {formatValue(d.value)}
            </text>
            {/* Category label under the baseline */}
            <text
              x={x + barW / 2}
              y={baselineY + 18}
              textAnchor="middle"
              fontSize={11}
              fill={LABEL}
            >
              {truncateLabel(d.label, slot)}
            </text>
          </g>
        );
      })}
    </svg>
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

/** Round a max value up to a clean axis ceiling (1/2/5 × 10^n). */
function niceCeil(value: number): number {
  if (value <= 0) return 0;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const frac = value / base;
  let nice: number;
  if (frac <= 1) nice = 1;
  else if (frac <= 2) nice = 2;
  else if (frac <= 5) nice = 5;
  else nice = 10;
  return nice * base;
}

/** Avoid float noise on axis ticks (e.g. 0.30000000004). */
function roundForAxis(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Roughly cap a label to the available horizontal slot. */
function truncateLabel(label: string, slot: number): string {
  const maxChars = Math.max(4, Math.floor(slot / 7));
  return label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
}

export default BarChart;
