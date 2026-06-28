"use client";

import { useRef, useState } from "react";
import { FileText, Image, Upload, Trash2, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardBody, Button, EmptyState, useToast } from "@/components/ui";
import { useActor } from "@/lib/auth/AuthProvider";
import { updateShipment } from "@/lib/db/repositories/shipments";
import { uploadFiles, deleteFileByUrl } from "@/lib/firebase/storage";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "heif", "tif", "tiff"];

/** Lowercased file extension of a document URL, ignoring query/hash. */
function extensionOf(url: string): string {
  const clean = url.split(/[?#]/)[0];
  const lastSegment = clean.split("/").pop() ?? "";
  const dot = lastSegment.lastIndexOf(".");
  return dot >= 0 ? lastSegment.slice(dot + 1).toLowerCase() : "";
}

function isImage(url: string): boolean {
  return IMAGE_EXTENSIONS.includes(extensionOf(url));
}

function isPdf(url: string): boolean {
  return extensionOf(url) === "pdf";
}

/**
 * Derive a human-friendly filename from a storage URL: decode the last path
 * segment and strip the `{timestamp}-` prefix added by `uploadFile`.
 */
function fileNameOf(url: string): string {
  const clean = url.split(/[?#]/)[0];
  const rawSegment = clean.split("/").pop() ?? "";
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawSegment);
  } catch {
    decoded = rawSegment;
  }
  // Firebase Storage object paths are encoded with "/" as "%2F"; keep only the
  // final segment after decoding (e.g. "shipments/abc/documents/123-file.pdf").
  const tail = decoded.split("/").pop() ?? decoded;
  // Strip the leading timestamp prefix written as `${Date.now()}-`.
  const stripped = tail.replace(/^\d{10,}-/, "");
  return stripped || tail || "Document";
}

export function DocumentManager({
  shipmentId,
  documentUrls,
  canManage,
}: {
  shipmentId: string;
  documentUrls: string[];
  canManage: boolean;
}) {
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [urls, setUrls] = useState<string[]>(documentUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newUrls = await uploadFiles(`shipments/${shipmentId}/documents`, files);
      const merged = [...urls, ...newUrls];
      await updateShipment(shipmentId, { documentUrls: merged }, actor);
      setUrls(merged);
      success(`Uploaded ${newUrls.length} document${newUrls.length === 1 ? "" : "s"}.`);
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : "Failed to upload documents. Please try again.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove(url: string) {
    setRemoving(url);
    try {
      await deleteFileByUrl(url);
      const remaining = urls.filter((u) => u !== url);
      await updateShipment(shipmentId, { documentUrls: remaining }, actor);
      setUrls(remaining);
      success("Document removed.");
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : "Failed to remove document. Please try again.",
      );
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Documents"
        subtitle="Customs forms, receipts, ID copies and other attachments."
        action={
          canManage ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
                disabled={uploading}
              >
                {uploading ? (
                  <>Uploading…</>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload
                  </>
                )}
              </Button>
            </>
          ) : undefined
        }
      />
      <CardBody>
        {urls.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description={
              canManage
                ? "Upload PDFs or images such as customs forms, receipts and ID copies."
                : "No documents have been attached to this shipment."
            }
          />
        ) : (
          <ul className="divide-y divide-navy-100">
            {urls.map((url) => {
              const name = fileNameOf(url);
              const pdf = isPdf(url);
              const Icon = pdf ? FileText : isImage(url) ? Image : FileText;
              const iconTone = pdf ? "text-red-500" : "text-brand-500";
              return (
                <li key={url} className="flex items-center gap-3 py-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50"
                    aria-hidden
                  >
                    <Icon className={`h-4.5 w-4.5 ${iconTone}`} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-navy-800" title={name}>
                    {name}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:bg-navy-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View / Download
                    </a>
                    {canManage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${name}`}
                        loading={removing === url}
                        disabled={removing === url}
                        onClick={() => handleRemove(url)}
                      >
                        {removing !== url && <Trash2 className="h-4 w-4 text-red-500" />}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
