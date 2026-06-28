import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { formatCustomerCode } from "@/lib/utils/ids";
import type { CustomerType } from "@/types";

interface RegisterBody {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  country: string;
  city?: string;
  address?: string;
  customerType: CustomerType;
}

function hasCode(err: unknown): err is { code: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

export async function POST(req: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { ok: false, error: "Registration is not configured." },
      { status: 503 },
    );
  }

  let body: RegisterBody;
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const fullName = body.fullName?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const country = body.country?.trim();
  const city = body.city?.trim();
  const address = body.address?.trim();
  const customerType = body.customerType;

  if (!fullName || !phone || !email || !password || !country || !customerType) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const auth = getAdminAuth();
  const now = new Date().toISOString();

  let customerId: string | null = null;

  try {
    // 1. Atomically increment the customer counter to get a gap-free sequence.
    const counterRef = db.collection("counters").doc("customer");
    const seq = await db.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      const current = (snap.data()?.value as number | undefined) ?? 0;
      const next = current + 1;
      tx.set(
        counterRef,
        { value: next, updatedAt: now },
        { merge: true },
      );
      return next;
    });
    const customerCode = formatCustomerCode(seq);

    // 2. Create the customer document (Liberty always owns the record).
    const customerRef = await db.collection("customers").add({
      fullName,
      phone,
      email,
      country,
      city: city ?? null,
      address: address ?? null,
      customerType,
      source: "online",
      ownedBy: "liberty",
      shipmentCount: 0,
      totalSpend: 0,
      active: true,
      customerCode,
      createdAt: now,
      createdBy: "self_registration",
    });
    customerId = customerRef.id;

    // 3. Create the Firebase Auth user.
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: fullName,
      });
    } catch (err) {
      // Roll back the orphan customer doc (best effort) before reporting.
      try {
        await customerRef.delete();
      } catch {
        /* best effort */
      }
      customerId = null;

      if (hasCode(err) && err.code === "auth/email-already-exists") {
        return NextResponse.json(
          {
            ok: false,
            error: "An account with this email already exists. Try signing in instead.",
          },
          { status: 409 },
        );
      }
      throw err;
    }

    // 4. Custom claims drive Firestore security rules.
    await auth.setCustomUserClaims(userRecord.uid, {
      role: "customer",
      org: "customer",
      customerId,
    });

    // 5. Create the linked user document.
    await db
      .collection("users")
      .doc(userRecord.uid)
      .set({
        email,
        displayName: fullName,
        role: "customer",
        organization: "customer",
        customerId,
        phone,
        active: true,
        createdAt: now,
        createdBy: "self_registration",
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Registration failed. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
