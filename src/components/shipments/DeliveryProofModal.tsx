"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Eraser, Upload, X } from "lucide-react";
import { Button, Field, Input, Modal, Textarea, useToast } from "@/components/ui";
import { uploadFiles } from "@/lib/firebase/storage";

export interface DeliveryProofInput {
  recipientName: string;
  photoUrls: string[];
  signatureDataUrl?: string;
  note?: string;
}

export function DeliveryProofModal({
  shipmentId,
  open,
  onClose,
  onCaptured,
  submitting = false,
}: {
  shipmentId: string;
  open: boolean;
  onClose: () => void;
  onCaptured: (proof: DeliveryProofInput) => Promise<void> | void;
  submitting?: boolean;
}) {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipientName, setRecipientName] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);

  // Signature pad ----------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  // Reset the form each time the modal opens so a previous capture never leaks
  // into the next shipment's proof.
  useEffect(() => {
    if (!open) return;
    setRecipientName("");
    setPhotoUrls([]);
    setNote("");
    setUploading(false);
    setHasSignature(false);
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [open]);

  function getContext(): CanvasRenderingContext2D | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function pointerPosition(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Map CSS pixels to the canvas' internal coordinate space.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const ctx = getContext();
    if (!ctx) return;
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const point = pointerPosition(e);
    lastPointRef.current = point;
    // Draw an initial dot so single taps register.
    ctx.beginPath();
    ctx.fillStyle = "#0f172a";
    ctx.arc(point.x, point.y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = getContext();
    const last = lastPointRef.current;
    if (!ctx || !last) return;
    const point = pointerPosition(e);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    if (!hasSignature) setHasSignature(true);
  }

  function endStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (canvasRef.current?.hasPointerCapture(e.pointerId)) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingRef.current = false;
    lastPointRef.current = null;
    setHasSignature(false);
  }

  // Photos -----------------------------------------------------------------
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await uploadFiles(`shipments/${shipmentId}/proof`, files);
      setPhotoUrls((prev) => [...prev, ...urls]);
      success(`Uploaded ${urls.length} photo${urls.length === 1 ? "" : "s"}.`);
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : "Failed to upload photos. Please try again.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  }

  // Submit -----------------------------------------------------------------
  const trimmedName = recipientName.trim();
  const canSubmit =
    trimmedName.length > 0 && photoUrls.length > 0 && !uploading && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    const signatureDataUrl =
      hasSignature && canvasRef.current
        ? canvasRef.current.toDataURL("image/png")
        : undefined;
    const trimmedNote = note.trim();
    await onCaptured({
      recipientName: trimmedName,
      photoUrls,
      signatureDataUrl,
      note: trimmedNote ? trimmedNote : undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Capture proof of delivery"
      description="Record who received the package, with photos and an optional signature."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="success"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
          >
            Confirm delivery
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Recipient */}
        <Field
          label="Received by"
          required
          htmlFor="proof-recipient"
          hint="Full name of the person who took receipt of the package."
        >
          <Input
            id="proof-recipient"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Ama Mensah"
            autoComplete="off"
          />
        </Field>

        {/* Proof photos */}
        <Field
          label="Proof photos"
          required
          hint="Upload one or more photos showing the delivered package or recipient."
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
            disabled={uploading}
          >
            {uploading ? (
              <>Uploading…</>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Upload photos
              </>
            )}
          </Button>

          {photoUrls.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photoUrls.map((url) => (
                <div
                  key={url}
                  className="group relative overflow-hidden rounded-lg border border-navy-100 bg-navy-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Delivery proof" className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute right-1 top-1 rounded-full bg-navy-950/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-navy-200 bg-navy-50/40 px-4 py-6 text-sm text-navy-400">
              <Camera className="h-5 w-5" /> No photos uploaded yet.
            </div>
          )}
        </Field>

        {/* Signature pad */}
        <Field
          label="Recipient signature"
          hint="Optional — have the recipient sign in the box below."
        >
          <div className="rounded-lg border border-navy-200 bg-white">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="h-40 w-full touch-none rounded-t-lg bg-navy-50/40"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endStroke}
              onPointerLeave={endStroke}
              onPointerCancel={endStroke}
            />
            <div className="flex items-center justify-between border-t border-navy-100 px-3 py-2">
              <span className="text-xs text-navy-400">
                {hasSignature ? "Signature captured" : "Sign above"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSignature}
                disabled={!hasSignature}
              >
                <Eraser className="h-4 w-4" /> Clear
              </Button>
            </div>
          </div>
        </Field>

        {/* Note */}
        <Field
          label="Delivery note"
          htmlFor="proof-note"
          hint="Optional — any remarks about the handover."
        >
          <Textarea
            id="proof-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Left with building security at front desk."
          />
        </Field>
      </div>
    </Modal>
  );
}
