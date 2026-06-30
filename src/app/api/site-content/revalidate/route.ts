import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCaller, isSuperAdminCaller } from "@/lib/auth/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public marketing routes that render editable site content. */
const MARKETING_PATHS = ["/", "/services", "/coverage", "/about", "/faq", "/contact", "/track", "/register"];

/**
 * On-demand revalidation of the statically-generated marketing pages, called by
 * the Website Content editor right after a Super Admin saves. This makes edits
 * appear immediately instead of waiting for the ISR window. Super Admin only.
 */
export async function POST(req: Request) {
  const caller = await verifyCaller(req);
  if (!isSuperAdminCaller(caller)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  for (const path of MARKETING_PATHS) {
    try {
      revalidatePath(path);
    } catch {
      /* ignore individual path failures */
    }
  }
  return NextResponse.json({ ok: true, revalidated: MARKETING_PATHS });
}
