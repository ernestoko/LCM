"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  Checkbox,
  KeyValue,
  InfoBanner,
  useToast,
} from "@/components/ui";
import { useActor } from "@/lib/auth/AuthProvider";
import {
  updateShipment,
  changeShipmentStatus,
} from "@/lib/db/repositories/shipments";
import { getCustomer } from "@/lib/db/repositories/customers";
import { notify } from "@/lib/notifications/service";
import { channelsForCustomer } from "@/lib/notifications/channels";
import { uploadFiles } from "@/lib/firebase/storage";
import { SeaCargoEditor } from "@/components/shipments/SeaCargoEditor";
import { totalCbm, totalSeaPieces } from "@/lib/utils/cbm";
import type { PackageCondition, PlatformSettings, Shipment, SeaCargo } from "@/types";

const CONDITION_OPTIONS: { value: PackageCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
  { value: "mixed", label: "Mixed" },
];

export function IntakeForm({
  shipment,
  settings,
  onDone,
}: {
  shipment: Shipment;
  settings: PlatformSettings;
  onDone: () => void;
}) {
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate from any prior partial intake so re-opening is non-destructive.
  const [photoUrls, setPhotoUrls] = useState<string[]>(shipment.photoUrls ?? []);
  const [weightLb, setWeightLb] = useState<string>(
    shipment.weightLb != null ? String(shipment.weightLb) : "",
  );
  const [pieces, setPieces] = useState<string>(
    shipment.pieces != null ? String(shipment.pieces) : "1",
  );
  const [lengthIn, setLengthIn] = useState<string>(
    shipment.dimensions?.lengthIn != null ? String(shipment.dimensions.lengthIn) : "",
  );
  const [widthIn, setWidthIn] = useState<string>(
    shipment.dimensions?.widthIn != null ? String(shipment.dimensions.widthIn) : "",
  );
  const [heightIn, setHeightIn] = useState<string>(
    shipment.dimensions?.heightIn != null ? String(shipment.dimensions.heightIn) : "",
  );
  const [packageCondition, setPackageCondition] = useState<PackageCondition>(
    shipment.packageCondition ?? "used",
  );
  const [packageDescription, setPackageDescription] = useState<string>(
    shipment.packageDescription ?? "",
  );
  const [contentsConfirmed, setContentsConfirmed] = useState(false);
  const isSea = shipment.cargoType === "sea";
  const [seaCargo, setSeaCargo] = useState<SeaCargo>(
    shipment.seaCargo ?? { volumetric: [], units: [] },
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const weightValue = useMemo(() => Number.parseFloat(weightLb), [weightLb]);
  const hasPhoto = photoUrls.length > 0;
  const hasWeight = Number.isFinite(weightValue) && weightValue > 0;
  const seaCbm = totalCbm(seaCargo);
  const hasSeaCargo = seaCbm > 0 || seaCargo.units.length > 0;
  const measured = isSea ? hasSeaCargo : hasWeight;
  const canSubmit = hasPhoto && measured && contentsConfirmed && !uploading && !saving;

  const blockMessage = !hasPhoto
    ? "At least one package photo is required before intake can be completed."
    : !measured
      ? isSea
        ? "Add measured cargo (CBM) or at least one standard unit before completing intake."
        : "A package weight (lb) greater than zero is required before intake can be completed."
      : !contentsConfirmed
        ? "Confirm the declared contents against the package inspection before completing intake."
        : null;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await uploadFiles(`shipments/${shipment.id}/photos`, files);
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

  function parseNum(v: string): number | undefined {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const update: Partial<Shipment> = {
        photoUrls,
        packageCondition,
        packageDescription: packageDescription.trim(),
        sealHandlingStatus: "intake_complete",
      };
      if (isSea) {
        update.seaCargo = seaCargo;
        update.totalCbm = seaCbm;
        update.pieces = Math.max(1, totalSeaPieces(seaCargo));
        if (hasWeight) update.weightLb = weightValue;
      } else {
        update.weightLb = weightValue;
        update.pieces = Math.max(1, Number.parseInt(pieces, 10) || 1);
        update.dimensions = {
          lengthIn: parseNum(lengthIn),
          widthIn: parseNum(widthIn),
          heightIn: parseNum(heightIn),
        };
      }

      await updateShipment(shipment.id, update, actor);

      const result = await changeShipmentStatus(
        shipment.id,
        "received_by_seal",
        actor,
        settings,
        { note: "Package received & inspected at Operations" },
      );

      if (!result.ok) {
        toastError(result.reason ?? "Could not update shipment status.");
        return;
      }

      // Tell the customer their package has been received by SEAL.
      try {
        const customer = shipment.customerId ? await getCustomer(shipment.customerId) : null;
        await notify(
          "package_received",
          {
            userId: customer?.id,
            name: customer?.fullName ?? shipment.customerName,
            email: customer?.email,
            phone: customer?.phone,
          },
          { trackingNumber: shipment.trackingNumber },
          { shipmentId: shipment.id, channels: channelsForCustomer(customer) },
        );
      } catch {
        // Notification is best-effort.
      }

      success(`Intake complete for ${shipment.trackingNumber}.`);
      onDone();
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : "Failed to save intake. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Customer (read-only) */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-navy-100 bg-navy-50/40 p-4">
        <KeyValue label="Customer">{shipment.customerName}</KeyValue>
        <KeyValue label="Tracking">
          <span className="font-mono text-xs">{shipment.trackingNumber}</span>
        </KeyValue>
        <KeyValue label="Route">{shipment.routeCode}</KeyValue>
        <KeyValue label="Destination">{shipment.destinationCountry}</KeyValue>
      </div>

      {/* Photos */}
      <Field
        label="Package photos"
        required
        hint="Upload one or more clear photos of the received package."
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
                <img
                  src={url}
                  alt="Package"
                  className="h-24 w-full object-cover"
                />
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

      {/* Sea cargo — measured pieces (CBM) + standard units */}
      {isSea && (
        <div className="space-y-4">
          <SeaCargoEditor value={seaCargo} onChange={setSeaCargo} />
          <Field
            label="Weight (lb) — optional"
            htmlFor="intake-weight-sea"
            hint="Optional for sea cargo — pricing uses CBM / units."
          >
            <Input
              id="intake-weight-sea"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={weightLb}
              onChange={(e) => setWeightLb(e.target.value)}
              placeholder="0.00"
            />
          </Field>
        </div>
      )}

      {/* Packages + weight + dimensions (air) */}
      {!isSea && (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Packages" required htmlFor="intake-pieces" hint="Number of boxes">
          <Input
            id="intake-pieces"
            type="number"
            min={1}
            step="1"
            inputMode="numeric"
            value={pieces}
            onChange={(e) => setPieces(e.target.value)}
            placeholder="1"
          />
        </Field>
        <Field label="Weight (lb)" required htmlFor="intake-weight">
          <Input
            id="intake-weight"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={weightLb}
            onChange={(e) => setWeightLb(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Length (in)" htmlFor="intake-length">
          <Input
            id="intake-length"
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            value={lengthIn}
            onChange={(e) => setLengthIn(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Width (in)" htmlFor="intake-width">
          <Input
            id="intake-width"
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            value={widthIn}
            onChange={(e) => setWidthIn(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Height (in)" htmlFor="intake-height">
          <Input
            id="intake-height"
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            value={heightIn}
            onChange={(e) => setHeightIn(e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>
      )}

      {/* Condition + description */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Package condition" required htmlFor="intake-condition">
          <Select
            id="intake-condition"
            value={packageCondition}
            onChange={(e) => setPackageCondition(e.target.value as PackageCondition)}
          >
            {CONDITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Package description"
        htmlFor="intake-description"
        hint="Describe the contents as observed during inspection."
      >
        <Textarea
          id="intake-description"
          value={packageDescription}
          onChange={(e) => setPackageDescription(e.target.value)}
          placeholder="e.g. 1 carton — assorted clothing and 2 used phones"
        />
      </Field>

      <Checkbox
        checked={contentsConfirmed}
        onChange={(e) => setContentsConfirmed(e.target.checked)}
        label="Declared contents confirmed against the package inspection"
      />

      {blockMessage && <InfoBanner tone="warning">{blockMessage}</InfoBanner>}

      <div className="flex items-center justify-end gap-2 border-t border-navy-100 pt-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          loading={saving}
          disabled={!canSubmit}
        >
          Complete intake
        </Button>
      </div>
    </div>
  );
}
