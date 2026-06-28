"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface LineChartDatum {
  label: string;
  value: number;
}

const LINE = "#3463ff"; // brand-500
const AREA_FROM = "#3463ff"; // brand-500 (faded via gradient stops)
const DOT = "#1d40f5"; // brand-600
const AXIS = "#cdd9ec"; // navy-200
const GRID = "#e3eaf5"; // navy-100
const LABEL = "#3d5283"; // navy-700
const VALUE = "#0f1b3d"; // navy-900

export interface LineChartProps {
  data: LineChartDatum[];
  width?: number;
  height?: number;
  /** Stroke/area/dot colour. */
  color?: string;
  /** Format a raw value into a display string (axis + tooltip). */
  formatValue?: (v: number) => string;
  title?: string;
  className?: string;
  emptyLabel?: string;
}

/**
 * Dependency-free line + area chart (pure SVG) with gridlines and dot markers.
 * Responsive via `viewBox`; each marker exposes a `<title>` tooltip.
 */
export function LineChart({
  data,
  width = 640,
  height = 320,
  color = LINE,
  formatValue = (v) => `${v}`,
  title = "Line chart",
  className,
  emptyLabel = "No data to display",
}: LineChartProps) {
  const titleId = useId();
  const gradientId = useId();

  if (data.length === 0) {
    return <ChartEmpty className={className} label={emptyLabel} />;
  }

  const padTop = 24;
  const padBottom = 44;
  const padLeft = 52;
  const padRight = 20;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baselineY = padTop + plotH;

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const niceMax = niceCeil(maxValue);

  // X positions: single point sits centred; otherwise spread edge to edge.
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;
  const pointX = (i: number) =>
    data.length > 1 ? padLeft + i * stepX : padLeft + plotW / 2;
  const pointY = (v: number) =>
    niceMax > 0 ? baselineY - (v / niceMax) * plotH : baselineY;

  const points = data.map((d, i) => ({
    x: pointX(i),
    y: pointY(d.value),
    datum: d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${baselineY} ` +
    `L ${points[0].x.toFixed(2)} ${baselineY} Z`;

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

      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={AREA_FROM} stopOpacity={0.22} />
          <stop offset="100%" stopColor={AREA_FROM} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Gridlines + y-axis labels */}
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

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dot markers + x labels */}
      {points.map((p, i) => (
        <g key={`${p.datum.label}-${i}`}>
          <circle cx={p.x} cy={p.y} r={4} fill="#ffffff" stroke={DOT} strokeWidth={2}>
            <title>{`${p.datum.label}: ${formatValue(p.datum.value)}`}</title>
          </circle>
          <text
            x={p.x}
            y={baselineY + 18}
            textAnchor="middle"
            fontSize={11}
            fill={LABEL}
          >
            {p.datum.label}
          </text>
        </g>
      ))}

      {/* Peak value callout */}
      {points.length > 0 &&
        (() => {
          const peak = points.reduce((a, b) => (b.datum.value > a.datum.value ? b : a));
          if (peak.datum.value <= 0) return null;
          return (
            <text
              x={peak.x}
              y={peak.y - 10}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill={VALUE}
            >
              {formatValue(peak.datum.value)}
            </text>
          );
        })()}
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

function roundForAxis(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export default LineChart;
