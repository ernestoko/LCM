"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useInvoices } from "@/lib/db/repositories/invoices";
import { usePayments } from "@/lib/db/repositories/payments";
import { usePilotTracker } from "@/lib/db/repositories/settings";
import { SettlementDocument } from "@/components/reports/SettlementDocument";
import {
  PageHeader,
  Button,
  Card,
  CardBody,
  Field,
  Input,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui";

/** ISO timestamp → yyyy-MM-dd value an <input type="date"> needs. */
function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : "";
}

/** yyyy-MM-dd input value → ISO timestamp at the start of that UTC day. */
function startOfDayISO(value: string): string {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : "";
}

/** yyyy-MM-dd input value → ISO timestamp at the end of that UTC day (inclusive). */
function endOfDayISO(value: string): string {
  return value ? new Date(`${value}T23:59:59.999Z`).toISOString() : "";
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoInput(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function firstOfMonthInput(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function SettlementReport() {
  const { data: invoices, loading: lInv, error: eInv } = useInvoices();
  const { data: payments, loading: lPay, error: ePay } = usePayments();
  const { pilot, loading: lPilot } = usePilotTracker();

  const loading = lInv || lPay || lPilot;
  const error = eInv || ePay;

  // Default window: pilot start → today (falling back to last 30 days if the
  // pilot start is in the future or unavailable).
  const defaultStart = useMemo(() => {
    const pilotStart = toDateInput(pilot.startDate);
    if (pilotStart && pilotStart <= todayInput()) return pilotStart;
    return daysAgoInput(30);
  }, [pilot.startDate]);

  const [startInput, setStartInput] = useState(defaultStart);
  const [endInput, setEndInput] = useState(todayInput());

  // Keep the start input in sync once the pilot doc resolves, but only while the
  // user hasn't deviated from the previous default.
  const [touched, setTouched] = useState(false);
  const effectiveStart = touched ? startInput : defaultStart;

  const periodStartISO = startOfDayISO(effectiveStart);
  const periodEndISO = endOfDayISO(endInput);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((inv) => {
        const ts = inv.createdAt;
        if (!ts) return false;
        if (periodStartISO && ts < periodStartISO) return false;
        if (periodEndISO && ts > periodEndISO) return false;
        return true;
      }),
    [invoices, periodStartISO, periodEndISO],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        const ts = p.paymentDate;
        if (!ts) return false;
        if (periodStartISO && ts < periodStartISO) return false;
        if (periodEndISO && ts > periodEndISO) return false;
        return true;
      }),
    [payments, periodStartISO, periodEndISO],
  );

  function applyPreset(start: string, end: string) {
    setTouched(true);
    setStartInput(start);
    setEndInput(end);
  }

  if (loading) return <LoadingState label="Loading settlement…" />;
  if (error) return <ErrorState message={error.message} />;

  const hasSettlement = filteredInvoices.some((inv) => inv.commission);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEAL Settlement Report"
        description="Reconcile what Liberty owes SEAL against what Liberty earns for a chosen period."
        actions={
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to Reports
            </Button>
          </Link>
        }
      />

      {/* Period filter + actions — excluded from print. */}
      <Card className="no-print">
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="From" htmlFor="settlement-start">
              <Input
                id="settlement-start"
                type="date"
                value={effectiveStart}
                max={endInput || undefined}
                onChange={(e) => {
                  setTouched(true);
                  setStartInput(e.target.value);
                }}
              />
            </Field>
            <Field label="To" htmlFor="settlement-end">
              <Input
                id="settlement-end"
                type="date"
                value={endInput}
                min={effectiveStart || undefined}
                onChange={(e) => {
                  setTouched(true);
                  setEndInput(e.target.value);
                }}
              />
            </Field>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print / Download
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-400">
              Quick range
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset(firstOfMonthInput(), todayInput())}
            >
              This month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset(daysAgoInput(30), todayInput())}
            >
              Last 30 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                applyPreset(
                  toDateInput(pilot.startDate) || daysAgoInput(30),
                  toDateInput(pilot.endDate) || todayInput(),
                )
              }
            >
              Whole pilot
            </Button>
          </div>
        </CardBody>
      </Card>

      {hasSettlement ? (
        <SettlementDocument
          invoices={filteredInvoices}
          payments={filteredPayments}
          periodStart={periodStartISO}
          periodEnd={periodEndISO}
        />
      ) : (
        <Card className="no-print">
          <CardBody>
            <EmptyState
              title="Nothing to settle in this period"
              description="No invoiced shipments with a commission breakdown fall within the selected dates. Adjust the period or pick a quick range above."
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default function SettlementReportPage() {
  return (
    <RequirePermission permission="commission.view">
      <SettlementReport />
    </RequirePermission>
  );
}
