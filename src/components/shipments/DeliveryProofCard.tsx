"use client";

import { Card, CardBody, CardHeader, KeyValue } from "@/components/ui";
import { fromNow } from "@/lib/utils/dates";
import type { Shipment } from "@/types";

export function DeliveryProofCard({
  proof,
}: {
  proof: NonNullable<Shipment["deliveryProof"]>;
}) {
  if (!proof) return null;

  const capturedBy = proof.byName ?? proof.by;

  return (
    <Card>
      <CardHeader title="Proof of delivery" subtitle={`Captured ${fromNow(proof.at)}`} />
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KeyValue label="Received by">{proof.recipientName}</KeyValue>
          <KeyValue label="Captured by">{capturedBy}</KeyValue>
        </div>

        {proof.photoUrls.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-navy-700">Photos</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {proof.photoUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-navy-100 bg-navy-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Delivery proof" className="h-24 w-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {proof.signatureDataUrl && (
          <div>
            <p className="mb-2 text-xs font-medium text-navy-700">Recipient signature</p>
            <div className="inline-block rounded-lg border border-navy-200 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proof.signatureDataUrl}
                alt="Recipient signature"
                className="h-28 w-auto max-w-full object-contain"
              />
            </div>
          </div>
        )}

        {proof.note && (
          <div>
            <p className="mb-1 text-xs font-medium text-navy-700">Delivery note</p>
            <p className="whitespace-pre-wrap text-sm text-navy-600">{proof.note}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
