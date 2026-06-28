import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { ROLE_ORG } from "@/constants/roles";
import type { Role } from "@/types";

interface CreateUserBody {
  email: string;
  password: string;
  displayName: string;
  role: Role;
  phone?: string;
  sealOffice?: string;
  customerId?: string;
}

/** Verify the caller is a signed-in Liberty Super Admin via their ID token. */
async function requireSuperAdmin(req: Request): Promise<{ uid: string } | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (decoded.role !== "liberty_super_admin") return null;
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json({ ok: false, error: "Admin SDK not configured." }, { status: 500 });
  }
  const caller = await requireSuperAdmin(req);
  if (!caller) {
    return NextResponse.json({ ok: false, error: "Forbidden — Super Admin only." }, { status: 403 });
  }

  let body: CreateUserBody;
  try {
    body = (await req.json()) as CreateUserBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, displayName, role, phone, sealOffice, customerId } = body;
  if (!email || !password || !displayName || !role) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const org = ROLE_ORG[role];

  try {
    const auth = getAdminAuth();
    const userRecord = await auth.createUser({ email, password, displayName });

    // Custom claims drive Firestore security rules.
    await auth.setCustomUserClaims(userRecord.uid, {
      role,
      org,
      ...(sealOffice ? { sealOffice } : {}),
      ...(customerId ? { customerId } : {}),
    });

    await getAdminDb()
      .collection("users")
      .doc(userRecord.uid)
      .set({
        email,
        displayName,
        role,
        organization: org,
        phone: phone ?? null,
        sealOffice: sealOffice ?? null,
        customerId: customerId ?? null,
        active: true,
        createdAt: new Date().toISOString(),
        createdBy: caller.uid,
      });

    return NextResponse.json({ ok: true, uid: userRecord.uid });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
