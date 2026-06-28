import "server-only";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";
import type { Role } from "@/types";

export interface VerifiedCaller {
  uid: string;
  role?: Role;
  org?: string;
  customerId?: string;
}

/**
 * Verify the `Authorization: Bearer <idToken>` header against Firebase Auth.
 * Returns the decoded claims, or null when the SDK is unconfigured, the header
 * is missing, or the token is invalid.
 */
export async function verifyCaller(req: Request): Promise<VerifiedCaller | null> {
  if (!isAdminConfigured) return null;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      role: decoded.role as Role | undefined,
      org: decoded.org as string | undefined,
      customerId: decoded.customerId as string | undefined,
    };
  } catch {
    return null;
  }
}

export const isStaffCaller = (c: VerifiedCaller | null): boolean =>
  Boolean(c && c.org !== "customer");

export const isLibertyCaller = (c: VerifiedCaller | null): boolean =>
  Boolean(c && c.org === "liberty");

export const isSuperAdminCaller = (c: VerifiedCaller | null): boolean =>
  c?.role === "liberty_super_admin";
