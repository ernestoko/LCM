"use client";

import Link from "next/link";
import type { Shipment } from "@/types";
import { Card, CardHeader, StatusBadge, Table, THead, TH, TBody, TR, TD } from "@/components/ui";
import { SHIPMENT_STATUS_META } from "@/constants/statuses";
import { fromNow } from "@/lib/utils/dates";

export function RecentShipments({ shipments, limit = 8 }: { shipments: Shipment[]; limit?: number }) {
  const rows = shipments.slice(0, limit);
  return (
    <Card>
      <CardHeader
        title="Recent shipments"
        action={
          <Link href="/shipments" className="text-xs font-medium text-brand-600 hover:underline">
            View all
          </Link>
        }
      />
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-navy-400">No shipments yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Tracking</TH>
              <TH>Customer</TH>
              <TH>Route</TH>
              <TH>Status</TH>
              <TH>Updated</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((s) => (
              <TR key={s.id}>
                <TD>
                  <Link href={`/shipments/${s.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">
                    {s.trackingNumber}
                  </Link>
                </TD>
                <TD className="font-medium text-navy-800">{s.customerName}</TD>
                <TD className="text-xs">{s.routeCode}</TD>
                <TD>
                  <StatusBadge meta={SHIPMENT_STATUS_META[s.status]} />
                </TD>
                <TD className="text-xs text-navy-400">{fromNow(s.updatedAt ?? s.createdAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}
