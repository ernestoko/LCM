/**
 * Recursively strip `undefined` values before writing to Firestore.
 *
 * Firestore rejects any `undefined` value (including ones nested inside plain
 * objects and arrays) with "Unsupported field value: undefined". A shallow
 * strip is not enough — shipment `dimensions`, `deliveryProof`, customer
 * `idVerification`, manifest `packages[]` etc. all contain optional nested
 * fields that are frequently `undefined`.
 *
 * Plain objects and arrays are recursed; everything else (Date, Firestore
 * `FieldValue`/`Timestamp` sentinels, class instances) is passed through
 * untouched so server-timestamp sentinels keep working.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== undefined)
      .map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v);
    }
    return out as unknown as T;
  }
  return value;
}

/**
 * Prepare a document body for a Firestore write: drop the `id` field and
 * deep-strip `undefined`. Returns a new object; the input is not mutated.
 */
export function cleanForWrite(data: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (k === "id" || v === undefined) continue;
    out[k] = stripUndefinedDeep(v);
  }
  return out;
}
