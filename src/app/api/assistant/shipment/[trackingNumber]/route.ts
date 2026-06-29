import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase/admin";
import { verifyVerifyToken } from "@/lib/security/otp";
import {
  findShipmentByTracking,
  loadInvoiceForShipment,
  buildSensitiveProjection,
} from "@/lib/assistant/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authorised shipment detail for the assistant. Requires the bearer token
 * minted by `/api/assistant/verify/confirm` (header `x-assistant-verify`), and
 * the token must match the requested tracking number. Returns the fuller,
 * shipment-scoped projection (recipient details, contents, invoice/balance,
 * timeline with locations) — never any OTHER shipment's data.
 */
export async function GET(
  req: Request,
  { params }: { params: { trackingNumber: string } },
): Promise<NextResponse> {
  if (!isAdminConfigured) {
    return NextResponse.json({ ok: false, error: "Not configured." }, { status: 503 });
  }

  const tn = params.trackingNumber?.trim().toUpperCase() ?? "";
  const token =
    req.headers.get("x-assistant-verify") ??
    (req.headers.get("authorization")?.startsWith("Bearer ")
      ? req.headers.get("authorization")!.slice(7)
      : null);

  const claims = verifyVerifyToken(token);
  if (!claims || claims.trackingNumber.toUpperCase() !== tn) {
    return NextResponse.json(
      { ok: false, error: "Your verification has expired. Please verify again." },
      { status: 401 },
    );
  }

  try {
    const record = await findShipmentByTracking(tn);
    if (!record) {
      return NextResponse.json({ ok: false, error: "Shipment not found." }, { status: 404 });
    }
    const invoice = await loadInvoiceForShipment({ ...record.data, id: record.id });
    return NextResponse.json({
      ok: true,
      shipment: buildSensitiveProjection({ ...record.data, id: record.id }, invoice),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
