"use client";

/**
 * Client-side CSV export helper for the Reports module.
 *
 * Converts an array of flat record objects into an RFC-4180 CSV string (the
 * header row is the union of keys across all rows) and triggers a browser
 * download via a Blob + temporary anchor element. A UTF-8 BOM is prepended so
 * spreadsheet apps (Excel) detect the encoding correctly.
 */

/** RFC-4180 escaping: wrap in quotes if the value contains a comma, quote, CR or LF. */
function escapeCell(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Convert rows to a CSV string. The header is the union of keys across all rows. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }
  return lines.join("\r\n");
}

/** Build a CSV from rows and trigger a download in the browser. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  const csv = toCsv(rows);
  // Prepend a UTF-8 BOM so Excel reads non-ASCII characters correctly.
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
