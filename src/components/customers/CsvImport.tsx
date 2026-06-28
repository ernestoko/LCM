"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Download, FileSpreadsheet, Play } from "lucide-react";
import {
  Button,
  Textarea,
  Table,
  THead,
  TBody,
  TR,
  TD,
  TH,
  InfoBanner,
  Badge,
  useToast,
} from "@/components/ui";
import { useActor } from "@/lib/auth/AuthProvider";
import { createCustomer, type NewCustomer } from "@/lib/db/repositories/customers";
import { CUSTOMER_TYPE_LABELS, CUSTOMER_SOURCE_LABELS } from "@/constants/statuses";
import { PILOT_COUNTRIES } from "@/constants/seed-data";
import type { CustomerType, CustomerSource } from "@/types";

// ---------------------------------------------------------------------------
// CSV parsing — dependency-free, RFC-4180-ish.
// Handles quoted fields, escaped quotes (""), and commas / newlines in quotes.
// ---------------------------------------------------------------------------

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  // Normalise BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote.
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      // Swallow CR; a following LF ends the row, a lone CR also ends it.
      if (text[i + 1] === "\n") {
        pushRow();
        i += 2;
      } else {
        pushRow();
        i += 1;
      }
      continue;
    }
    if (ch === "\n") {
      pushRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  // Flush the trailing field / row (unless the whole input was empty).
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  // Drop fully-blank rows (e.g. trailing newline produced an empty row).
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// ---------------------------------------------------------------------------
// Column mapping & row validation.
// ---------------------------------------------------------------------------

const EXPECTED_COLUMNS = [
  "fullName",
  "phone",
  "email",
  "country",
  "customerType",
  "source",
  "city",
  "address",
] as const;

type ColumnKey = (typeof EXPECTED_COLUMNS)[number];

const DEFAULT_TYPE: CustomerType = "individual";
const DEFAULT_SOURCE: CustomerSource = "walk_in";

const CUSTOMER_TYPE_KEYS = Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[];
const CUSTOMER_SOURCE_KEYS = Object.keys(CUSTOMER_SOURCE_LABELS) as CustomerSource[];

interface ParsedRow {
  /** 1-based source line number (excluding the header) for display. */
  lineNumber: number;
  data?: NewCustomer;
  /** A normalised echo for the preview table. */
  display: Record<ColumnKey, string>;
  valid: boolean;
  error?: string;
}

/** Resolve a column index for each expected header (case-insensitive). */
function buildColumnIndex(header: string[]): Record<ColumnKey, number> {
  const lower = header.map((h) => h.trim().toLowerCase());
  const index = {} as Record<ColumnKey, number>;
  for (const col of EXPECTED_COLUMNS) {
    index[col] = lower.indexOf(col.toLowerCase());
  }
  return index;
}

function coerceType(raw: string): CustomerType {
  const v = raw.trim().toLowerCase();
  return (CUSTOMER_TYPE_KEYS as string[]).includes(v) ? (v as CustomerType) : DEFAULT_TYPE;
}

function coerceSource(raw: string): CustomerSource {
  const v = raw.trim().toLowerCase();
  return (CUSTOMER_SOURCE_KEYS as string[]).includes(v) ? (v as CustomerSource) : DEFAULT_SOURCE;
}

function cell(row: string[], idx: number): string {
  if (idx < 0) return "";
  return (row[idx] ?? "").trim();
}

function buildRows(matrix: string[][]): { rows: ParsedRow[]; missingHeader: boolean } {
  if (matrix.length === 0) return { rows: [], missingHeader: false };

  const header = matrix[0];
  const colIndex = buildColumnIndex(header);
  const missingHeader = colIndex.fullName < 0 || colIndex.phone < 0;

  const rows: ParsedRow[] = matrix.slice(1).map((raw, i) => {
    const fullName = cell(raw, colIndex.fullName);
    const phone = cell(raw, colIndex.phone);
    const email = cell(raw, colIndex.email);
    const country = cell(raw, colIndex.country) || PILOT_COUNTRIES[0];
    const customerType = coerceType(cell(raw, colIndex.customerType));
    const source = coerceSource(cell(raw, colIndex.source));
    const city = cell(raw, colIndex.city);
    const address = cell(raw, colIndex.address);

    const display: Record<ColumnKey, string> = {
      fullName,
      phone,
      email,
      country,
      customerType,
      source,
      city,
      address,
    };

    let error: string | undefined;
    if (!fullName) error = "Missing full name.";
    else if (!phone) error = "Missing phone.";
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      error = "Invalid email address.";

    const data: NewCustomer | undefined = error
      ? undefined
      : {
          fullName,
          phone,
          email: email || undefined,
          country,
          city: city || undefined,
          address: address || undefined,
          customerType,
          source,
          active: true,
        };

    return {
      lineNumber: i + 1,
      data,
      display,
      valid: !error,
      error,
    };
  });

  return { rows, missingHeader };
}

// ---------------------------------------------------------------------------
// Template download.
// ---------------------------------------------------------------------------

const TEMPLATE_HEADER = EXPECTED_COLUMNS.join(",");
const TEMPLATE_EXAMPLE = [
  "Kwame Mensah",
  "+1 555 010 2030",
  "kwame@example.com",
  "Ghana",
  "individual",
  "walk_in",
  "Accra",
  "12 Liberation Rd",
].join(",");

function downloadTemplate() {
  const content = `${TEMPLATE_HEADER}\n${TEMPLATE_EXAMPLE}\n`;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "customer-import-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component.
// ---------------------------------------------------------------------------

export function CsvImport({ onDone }: { onDone?: (createdCount: number) => void }) {
  const actor = useActor();
  const { success, error: toastError, toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const { rows, missingHeader } = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { rows: [] as ParsedRow[], missingHeader: false };
    return buildRows(parseCsv(text));
  }, [text]);

  const validRows = useMemo(() => rows.filter((r) => r.valid), [rows]);
  const invalidCount = rows.length - validRows.length;

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setText(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => toastError("Could not read the selected file.");
    reader.readAsText(file);
  }

  async function handleImport() {
    if (importing || validRows.length === 0) return;
    setImporting(true);
    setProgress({ done: 0, total: validRows.length });

    let created = 0;
    const failures: string[] = [];

    for (let i = 0; i < validRows.length; i += 1) {
      const row = validRows[i];
      try {
        // data is guaranteed defined for valid rows.
        await createCustomer(row.data as NewCustomer, actor);
        created += 1;
      } catch (err) {
        failures.push(
          `Row ${row.lineNumber} (${row.display.fullName || "?"}): ${
            err instanceof Error ? err.message : "unknown error"
          }`,
        );
      }
      setProgress({ done: i + 1, total: validRows.length });
    }

    setImporting(false);

    if (created > 0 && failures.length === 0) {
      success(`Imported ${created} customer${created === 1 ? "" : "s"}.`);
    } else if (created > 0 && failures.length > 0) {
      toast(
        `Imported ${created} customer${created === 1 ? "" : "s"}; ${failures.length} failed.`,
        "info",
      );
    } else {
      toastError(`Import failed for all ${failures.length} customer(s).`);
    }

    if (failures.length > 0) {
      // Surface details so the operator can fix and retry.
      // eslint-disable-next-line no-console
      console.error("Customer import failures:\n" + failures.join("\n"));
    }

    if (created > 0) onDone?.(created);
  }

  return (
    <div className="space-y-6">
      {/* Input methods -------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4" /> Upload CSV file
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Download template
          </Button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-navy-700">
            …or paste CSV content
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={importing}
            placeholder={`${TEMPLATE_HEADER}\n${TEMPLATE_EXAMPLE}`}
            className="min-h-[140px] font-mono text-xs"
          />
        </div>
      </div>

      {/* Header warning ------------------------------------------------- */}
      {text.trim() && missingHeader && (
        <InfoBanner tone="warning">
          The header row must include at least <span className="font-mono">fullName</span> and{" "}
          <span className="font-mono">phone</span> columns. Expected columns:{" "}
          <span className="font-mono">{EXPECTED_COLUMNS.join(", ")}</span>.
        </InfoBanner>
      )}

      {/* Preview -------------------------------------------------------- */}
      {rows.length > 0 && !missingHeader && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="success">{validRows.length} valid</Badge>
              <Badge tone={invalidCount > 0 ? "danger" : "neutral"}>
                {invalidCount} invalid
              </Badge>
              <span className="text-navy-400">{rows.length} total rows</span>
            </div>
            <Button
              type="button"
              onClick={handleImport}
              loading={importing}
              disabled={importing || validRows.length === 0}
            >
              {!importing && <Play className="h-4 w-4" />}
              {importing
                ? `Importing ${progress.done} / ${progress.total}`
                : `Import ${validRows.length} customer${validRows.length === 1 ? "" : "s"}`}
            </Button>
          </div>

          <div className="rounded-xl border border-navy-100">
            <Table>
              <THead>
                <TR>
                  <TH>#</TH>
                  <TH>Status</TH>
                  <TH>Full name</TH>
                  <TH>Phone</TH>
                  <TH>Email</TH>
                  <TH>Country</TH>
                  <TH>Type</TH>
                  <TH>Source</TH>
                  <TH>City</TH>
                  <TH>Address</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <TR key={r.lineNumber} className={r.valid ? undefined : "bg-red-50/40"}>
                    <TD className="text-navy-400">{r.lineNumber}</TD>
                    <TD>
                      {r.valid ? (
                        <Badge tone="success">Valid</Badge>
                      ) : (
                        <Badge tone="danger" className="whitespace-normal">
                          {r.error}
                        </Badge>
                      )}
                    </TD>
                    <TD className="font-medium text-navy-900">{r.display.fullName || "—"}</TD>
                    <TD className="font-mono text-xs">{r.display.phone || "—"}</TD>
                    <TD>{r.display.email || "—"}</TD>
                    <TD>{r.display.country || "—"}</TD>
                    <TD>{CUSTOMER_TYPE_LABELS[r.display.customerType as CustomerType]}</TD>
                    <TD>{CUSTOMER_SOURCE_LABELS[r.display.source as CustomerSource]}</TD>
                    <TD>{r.display.city || "—"}</TD>
                    <TD>{r.display.address || "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      )}

      {/* Empty state hint ---------------------------------------------- */}
      {!text.trim() && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-navy-200 bg-navy-50/40 px-4 py-3 text-sm text-navy-500">
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-navy-400" />
          <span>
            Upload a <span className="font-mono">.csv</span> file or paste rows above to preview
            them before importing.
          </span>
        </div>
      )}
    </div>
  );
}
