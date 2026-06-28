"use client";

import { Plus, Trash2, Ruler, Boxes } from "lucide-react";
import type { SeaCargo } from "@/types";
import { SEA_UNIT_DEFS } from "@/constants/seaUnits";
import { pieceCbm, totalCbm, totalSeaPieces } from "@/lib/utils/cbm";
import { Button, Input, Select, Label } from "@/components/ui";

function genId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Editor for a shipment's SEA cargo: loose pieces measured by dimensions
 * (auto-computing CBM) plus standard units (boxes/drums). A single shipment may
 * mix both — they bill together on one invoice.
 */
export function SeaCargoEditor({
  value,
  onChange,
}: {
  value: SeaCargo;
  onChange: (next: SeaCargo) => void;
}) {
  const cbm = totalCbm(value);
  const pieces = totalSeaPieces(value);

  // --- Volumetric (measured) pieces ----------------------------------------
  const addVol = () =>
    onChange({
      ...value,
      volumetric: [
        ...value.volumetric,
        { id: genId("v"), label: "", lengthCm: 0, widthCm: 0, heightCm: 0, quantity: 1 },
      ],
    });
  const updVol = (id: string, patch: Partial<SeaCargo["volumetric"][number]>) =>
    onChange({
      ...value,
      volumetric: value.volumetric.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  const rmVol = (id: string) =>
    onChange({ ...value, volumetric: value.volumetric.filter((p) => p.id !== id) });

  // --- Standard units (boxes / drums) --------------------------------------
  const addUnit = () => {
    const d = SEA_UNIT_DEFS[0];
    onChange({
      ...value,
      units: [...value.units, { id: genId("u"), unitKey: d.key, label: d.label, quantity: 1 }],
    });
  };
  const updUnit = (id: string, patch: Partial<SeaCargo["units"][number]>) =>
    onChange({ ...value, units: value.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) });
  const rmUnit = (id: string) =>
    onChange({ ...value, units: value.units.filter((u) => u.id !== id) });
  const changeUnitKey = (id: string, key: string) => {
    const d = SEA_UNIT_DEFS.find((x) => x.key === key);
    updUnit(id, { unitKey: key, label: d?.label ?? key });
  };

  const num = (v: string) => Number(v) || 0;

  return (
    <div className="space-y-6">
      {/* Measured cargo → CBM */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-navy-800">
            <Ruler className="h-4 w-4 text-brand-600" /> Measured cargo (CBM)
          </h4>
          <Button type="button" variant="outline" size="sm" onClick={addVol}>
            <Plus className="h-4 w-4" /> Add piece
          </Button>
        </div>

        {value.volumetric.length === 0 ? (
          <p className="rounded-lg border border-dashed border-navy-200 bg-navy-50/40 px-4 py-3 text-xs text-navy-400">
            Add loose cargo by its dimensions (cm) — CBM is calculated automatically.
          </p>
        ) : (
          <div className="space-y-2">
            {value.volumetric.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-2 gap-2 rounded-lg border border-navy-100 bg-navy-50/40 p-3 sm:grid-cols-12 sm:items-end"
              >
                <div className="col-span-2 sm:col-span-3">
                  <Label htmlFor={`vl-${p.id}`}>Label</Label>
                  <Input
                    id={`vl-${p.id}`}
                    value={p.label ?? ""}
                    onChange={(e) => updVol(p.id, { label: e.target.value })}
                    placeholder="e.g. Crate"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`vL-${p.id}`}>L (cm)</Label>
                  <Input id={`vL-${p.id}`} type="number" min={0} step="0.1" inputMode="decimal" value={p.lengthCm || ""} onChange={(e) => updVol(p.id, { lengthCm: num(e.target.value) })} placeholder="0" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`vW-${p.id}`}>W (cm)</Label>
                  <Input id={`vW-${p.id}`} type="number" min={0} step="0.1" inputMode="decimal" value={p.widthCm || ""} onChange={(e) => updVol(p.id, { widthCm: num(e.target.value) })} placeholder="0" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`vH-${p.id}`}>H (cm)</Label>
                  <Input id={`vH-${p.id}`} type="number" min={0} step="0.1" inputMode="decimal" value={p.heightCm || ""} onChange={(e) => updVol(p.id, { heightCm: num(e.target.value) })} placeholder="0" />
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor={`vq-${p.id}`}>Qty</Label>
                  <Input id={`vq-${p.id}`} type="number" min={1} step="1" inputMode="numeric" value={p.quantity || ""} onChange={(e) => updVol(p.id, { quantity: Math.max(1, Math.floor(num(e.target.value))) })} placeholder="1" />
                </div>
                <div className="flex items-center justify-between sm:col-span-2 sm:justify-end sm:gap-2">
                  <span className="text-xs font-semibold text-navy-700">
                    {pieceCbm(p)} CBM
                  </span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => rmVol(p.id)} aria-label="Remove piece">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Standard units */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-navy-800">
            <Boxes className="h-4 w-4 text-brand-600" /> Standard units (boxes &amp; drums)
          </h4>
          <Button type="button" variant="outline" size="sm" onClick={addUnit}>
            <Plus className="h-4 w-4" /> Add unit
          </Button>
        </div>

        {value.units.length === 0 ? (
          <p className="rounded-lg border border-dashed border-navy-200 bg-navy-50/40 px-4 py-3 text-xs text-navy-400">
            Add standard units priced at a flat rate each (set on the sea rate card).
          </p>
        ) : (
          <div className="space-y-2">
            {value.units.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-12 gap-2 rounded-lg border border-navy-100 bg-navy-50/40 p-3 sm:items-end"
              >
                <div className="col-span-7 sm:col-span-8">
                  <Label htmlFor={`ut-${u.id}`}>Unit type</Label>
                  <Select id={`ut-${u.id}`} value={u.unitKey} onChange={(e) => changeUnitKey(u.id, e.target.value)}>
                    {SEA_UNIT_DEFS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Label htmlFor={`uq-${u.id}`}>Qty</Label>
                  <Input id={`uq-${u.id}`} type="number" min={1} step="1" inputMode="numeric" value={u.quantity || ""} onChange={(e) => updUnit(u.id, { quantity: Math.max(1, Math.floor(num(e.target.value))) })} placeholder="1" />
                </div>
                <div className="col-span-2 flex items-end justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => rmUnit(u.id)} aria-label="Remove unit">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Totals */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navy-100 bg-navy-50 px-4 py-3">
        <span className="text-sm text-navy-600">
          Total volume <strong className="font-semibold text-navy-900">{cbm} CBM</strong>
        </span>
        <span className="text-sm text-navy-600">
          {pieces} piece{pieces === 1 ? "" : "s"} to label
        </span>
      </div>
    </div>
  );
}
