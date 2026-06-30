import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase/admin";
import { recordPageView } from "@/lib/analytics/traffic";
import { consumeRateLimit, clientIp } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  path?: string;
  unique?: boolean;
}

/**
 * Public page-view beacon. Records ONLY aggregate, non-personal counters. The
 * IP is used transiently for rate-limiting (to stop count inflation) and is
 * never stored. Always returns 204 so the beacon never surfaces an error.
 */
export async function POST(req: Request) {
  if (!isAdminConfigured) return new NextResponse(null, { status: 204 });

  // Throttle per IP so the counters can't be trivially inflated.
  const limit = await consumeRateLimit(`pageview:${clientIp(req)}`, 240, 5 * 60 * 1000);
  if (!limit.allowed) return new NextResponse(null, { status: 204 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const path = typeof body.path === "string" ? body.path.slice(0, 200) : "";
  if (path.startsWith("/")) {
    await recordPageView(path, body.unique === true);
  }
  return new NextResponse(null, { status: 204 });
}
