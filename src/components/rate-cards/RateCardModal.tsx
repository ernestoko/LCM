"use client";

import { History, Tag } from "lucide-react";
import {
  Modal,
  Badge,
  StatusBadge,
  KeyValue,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from "@/components/ui";
import { RATE_CARD_STATUS_META, PRICING_TYPE_LABELS } from "@/constants/statuses";
import { formatMoney, titleCase } from "@/lib/utils/format";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import type { RateCard } from "@/types";

/**
 * Read-only detail view of a single rate card: pricing config, audit metadata
 * and the full change history. Active cards are immutable — nothing here edits.
 */
export function RateCardModal({
  card,
  open,
  onClose,
}: {
  card: RateCard | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!card) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card.name}
      description={`${PRICING_TYPE_LABELS[card.pricingType]} · version ${card.version}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <KeyValue label="Status">
            <StatusBadge meta={RATE_CARD_STATUS_META[card.status]} />
          </KeyValue>
          <KeyValue label="Pricing type">{PRICING_TYPE_LABELS[card.pricingType]}</KeyValue>
          <KeyValue label="Version">v{card.version}</KeyValue>
          <KeyValue label="Route">
            {card.route ? <span className="font-mono">{card.route}</span> : "All routes"}
          </KeyValue>
          <KeyValue label="Country">{card.country || "All countries"}</KeyValue>
          <KeyValue label="Currency">{card.currency}</KeyValue>
          <KeyValue label="Effective date">{formatDate(card.effectiveDate)}</KeyValue>
          <KeyValue label="Expiry date">
            {card.expiryDate ? formatDate(card.expiryDate) : "No expiry"}
          </KeyValue>
          <KeyValue label="Uploaded by">{card.uploadedByName || card.uploadedBy || "—"}</KeyValue>
          <KeyValue label="Approved by">
            {card.approvedByName || card.approvedBy || "Pending approval"}
          </KeyValue>
          {card.approvalDate && (
            <KeyValue label="Approved on">{formatDate(card.approvalDate)}</KeyValue>
          )}
        </div>

        {card.status === "rejected" && card.rejectionReason && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-medium">Rejected:</span> {card.rejectionReason}
          </div>
        )}

        {/* Pricing detail — varies by type */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
            <Tag className="h-4 w-4 text-navy-400" /> Pricing
          </h3>

          {card.pricingType === "item_based" && (
            card.items.length > 0 ? (
              <div className="rounded-lg border border-navy-100">
                <Table>
                  <THead>
                    <TR>
                      <TH>Item</TH>
                      <TH>Condition</TH>
                      <TH className="text-right">Unit price</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {card.items.map((item) => (
                      <TR key={item.key}>
                        <TD className="font-medium text-navy-800">{item.label}</TD>
                        <TD className="text-xs">
                          {item.condition ? (
                            <Badge tone="neutral">{titleCase(item.condition)}</Badge>
                          ) : (
                            "—"
                          )}
                        </TD>
                        <TD className="text-right font-medium">
                          {formatMoney(item.unitPrice, card.currency)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-navy-500">No item rates defined.</p>
            )
          )}

          {card.pricingType === "weight_based" && (
            <div className="grid grid-cols-2 gap-4">
              <KeyValue label="Price per lb">
                {card.pricePerLb != null
                  ? formatMoney(card.pricePerLb, card.currency)
                  : "—"}
              </KeyValue>
            </div>
          )}

          {card.pricingType === "service_fee" && (
            <div className="grid grid-cols-2 gap-4">
              <KeyValue label="Service fee">
                {card.serviceFee
                  ? formatMoney(card.serviceFee.amount, card.currency)
                  : "—"}
              </KeyValue>
              <KeyValue label="Enabled">
                {card.serviceFee?.enabled ? (
                  <Badge tone="success">Enabled</Badge>
                ) : (
                  <Badge tone="neutral">Disabled</Badge>
                )}
              </KeyValue>
              <KeyValue label="Waived for countries">
                {card.serviceFee && card.serviceFee.waivedForCountries.length > 0
                  ? card.serviceFee.waivedForCountries.join(", ")
                  : "None"}
              </KeyValue>
            </div>
          )}

          {card.pricingType === "special_handling" && (
            card.items.length > 0 ? (
              <div className="rounded-lg border border-navy-100">
                <Table>
                  <THead>
                    <TR>
                      <TH>Item</TH>
                      <TH className="text-right">Unit price</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {card.items.map((item) => (
                      <TR key={item.key}>
                        <TD className="font-medium text-navy-800">{item.label}</TD>
                        <TD className="text-right font-medium">
                          {formatMoney(item.unitPrice, card.currency)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-navy-500">No special-handling rates defined.</p>
            )
          )}
        </section>

        {/* Change history */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
            <History className="h-4 w-4 text-navy-400" /> Change history
          </h3>
          {card.changeLog.length === 0 ? (
            <p className="text-sm text-navy-500">No changes recorded.</p>
          ) : (
            <ol className="space-y-3 border-l border-navy-100 pl-4">
              {[...card.changeLog]
                .slice()
                .reverse()
                .map((entry, idx) => (
                  <li key={`${entry.at}-${idx}`} className="relative">
                    <span className="absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full bg-brand-400" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">{titleCase(entry.action)}</Badge>
                      <span className="text-sm font-medium text-navy-800">
                        {entry.byName || entry.by}
                      </span>
                      <span className="text-xs text-navy-400">
                        {formatDateTime(entry.at)}
                      </span>
                    </div>
                    {(entry.field || entry.oldValue != null || entry.newValue != null) && (
                      <p className="mt-0.5 text-xs text-navy-500">
                        {entry.field && <span className="font-medium">{entry.field}: </span>}
                        {entry.oldValue != null && <span>{String(entry.oldValue)} → </span>}
                        {entry.newValue != null && <span>{String(entry.newValue)}</span>}
                      </p>
                    )}
                    {entry.reason && (
                      <p className="mt-0.5 text-xs italic text-navy-500">“{entry.reason}”</p>
                    )}
                  </li>
                ))}
            </ol>
          )}
        </section>
      </div>
    </Modal>
  );
}
