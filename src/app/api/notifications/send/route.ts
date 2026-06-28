import { NextResponse } from "next/server";
import { renderTemplate, type TemplateContext } from "@/lib/notifications/templates";
import { sendEmail } from "@/lib/notifications/email";
import { sendSms } from "@/lib/notifications/mnotify";
import { verifyCaller, isStaffCaller } from "@/lib/auth/apiAuth";
import type { NotificationEvent } from "@/types";

interface SendBody {
  event: NotificationEvent;
  context: TemplateContext;
  email?: string;
  phone?: string;
}

/**
 * Dispatch a notification's email + SMS. Called by the client notification
 * service. Email and SMS providers are configured via environment variables;
 * both degrade gracefully when unconfigured.
 */
export async function POST(req: Request) {
  // Only authenticated staff may trigger outbound email/SMS — never an open relay.
  const caller = await verifyCaller(req);
  if (!isStaffCaller(caller)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: SendBody;
  try {
    body = (await req.json()) as SendBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { event, context, email, phone } = body;
  if (!event || !context) {
    return NextResponse.json({ ok: false, error: "event and context are required" }, { status: 400 });
  }

  const rendered = renderTemplate(event, {
    supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE,
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    ...context,
  });

  const results: Record<string, unknown> = {};

  if (email) {
    results.email = await sendEmail({ to: email, subject: rendered.subject, text: rendered.email });
  }
  if (phone) {
    results.sms = await sendSms([phone], rendered.sms);
  }

  return NextResponse.json({ ok: true, results });
}
