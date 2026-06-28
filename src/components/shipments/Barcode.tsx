"use client";

/**
 * Dependency-free Code128-B barcode rendered as inline SVG.
 *
 * Implements the standard Code128 encoding for character set B:
 *  - Start Code B  = value 104
 *  - Each printable ASCII char (32–126) encodes as value (charCode - 32)
 *  - Checksum (mod 103) = (start + Σ value_i * position_i) mod 103, position from 1
 *  - Stop = value 106, followed by the 2-bar (1,1) termination guard
 *
 * Each pattern in CODE128_PATTERNS is six digits describing alternating
 * bar/space module widths, starting with a bar. The total of every symbol's
 * widths is 11 modules; the Stop pattern is 13 modules (7 widths) including
 * the final termination bar. This is the canonical, verified Code128 table.
 */

// 107 symbol patterns (values 0–106). Each is a 6-char run of module widths,
// bar-first. Index 106 is the Stop symbol's leading 6 widths; the trailing
// "11" termination guard is appended explicitly during rendering.
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211214", "211232", "2331112",
];

const START_B = 104;
const STOP = 106;

interface Encoded {
  /** Module-width string for the whole symbol, bar-first. */
  widths: string;
  /** Whether every character was a valid Code128-B character. */
  valid: boolean;
}

function encodeCode128B(value: string): Encoded {
  let valid = true;
  // Map characters to Code128-B values; clamp unsupported chars to space.
  const charValues: number[] = [];
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code >= 32 && code <= 126) {
      charValues.push(code - 32);
    } else {
      valid = false;
      charValues.push(0); // space placeholder keeps the symbol scannable
    }
  }

  let checksum = START_B;
  charValues.forEach((v, i) => {
    checksum += v * (i + 1);
  });
  checksum %= 103;

  const symbolValues = [START_B, ...charValues, checksum, STOP];
  const widths = symbolValues.map((v) => CODE128_PATTERNS[v]).join("");

  return { widths, valid };
}

export interface BarcodeProps {
  value: string;
  height?: number;
  className?: string;
}

export function Barcode({ value, height = 80, className }: BarcodeProps) {
  const safeValue = value ?? "";
  const { widths } = encodeCode128B(safeValue);

  // Build <rect> bars from the module-width string. Odd indices (0-based) are
  // spaces; even indices are bars. One module = `moduleWidth` user units.
  const moduleWidth = 2;
  const quietZone = 10 * moduleWidth; // 10-module quiet zone each side
  let cursor = quietZone;
  const bars: { x: number; width: number }[] = [];

  for (let i = 0; i < widths.length; i += 1) {
    const w = Number(widths[i]) * moduleWidth;
    const isBar = i % 2 === 0;
    if (isBar && w > 0) {
      bars.push({ x: cursor, width: w });
    }
    cursor += w;
  }

  const totalWidth = cursor + quietZone;
  const barsHeight = height;

  return (
    <div
      className={className}
      style={{ display: "inline-block", textAlign: "center", maxWidth: "100%" }}
    >
      <svg
        viewBox={`0 0 ${totalWidth} ${barsHeight}`}
        width="100%"
        height={barsHeight}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Barcode for ${safeValue}`}
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <rect x={0} y={0} width={totalWidth} height={barsHeight} fill="#ffffff" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={0}
            width={bar.width}
            height={barsHeight}
            fill="#000000"
            shapeRendering="crispEdges"
          />
        ))}
      </svg>
      <div
        style={{
          marginTop: 4,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
          fontWeight: 700,
          letterSpacing: "0.18em",
          fontSize: Math.max(14, Math.round(barsHeight * 0.22)),
          color: "#000000",
          wordBreak: "break-all",
        }}
      >
        {safeValue}
      </div>
    </div>
  );
}
