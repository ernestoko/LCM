import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { formatCustomerCode } from "@/lib/utils/ids";
import { consumeRateLimit, clientIp } from "@/lib/security/rateLimit";
import { sendEmail } from "@/lib/notifications/email";
import type { CustomerType } from "@/types";

export const runtime = "nodejs";

const COMPANY = "Liberty & Liberty Logistics";

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

const VALID_CUSTOMER_TYPES: CustomerType[] = [
  "individual",
  "trader",
  "student",
  "church",
  "institution",
  "business",
  "online_seller",
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { ok: false, error: "Registration is not configured." },
      { status: 503 },
    );
  }

  // Throttle account creation per IP so the endpoint can't be used to spam
  // Firebase Auth or flood the customer database with bogus records.
  const ip = clientIp(req);
  const limit = await consumeRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many sign-up attempts. Please try again later." },
      { status: 429 },
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

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  // Never trust the client's customer type — must be a known value.
  if (!VALID_CUSTOMER_TYPES.includes(customerType)) {
    return NextResponse.json({ ok: false, error: "Invalid customer type." }, { status: 400 });
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

    // 4 + 5. Custom claims (drive Firestore rules) + the linked user document.
    // If either fails, roll back the Auth user AND customer doc so we never
    // leave an orphaned account that can sign in but has no profile/role.
    try {
      await auth.setCustomUserClaims(userRecord.uid, {
        role: "customer",
        org: "customer",
        customerId,
      });

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
    } catch (err) {
      try {
        await auth.deleteUser(userRecord.uid);
      } catch {
        /* best effort */
      }
      try {
        await customerRef.delete();
      } catch {
        /* best effort */
      }
      customerId = null;
      throw err;
    }

    // 6. Send an email-verification link (best effort — never blocks signup).
    try {
      const link = await auth.generateEmailVerificationLink(email);
      await sendEmail({
        to: email,
        subject: `Verify your email — ${COMPANY}`,
        text: `Hi ${fullName},\n\nWelcome to ${COMPANY}! Please confirm your email address to secure your account:\n\n${link}\n\nIf you didn't create this account, you can safely ignore this email.\n\n— ${COMPANY}`,
      });
    } catch {
      /* verification email is best-effort; account is still usable */
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Registration failed. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
