import { NextResponse } from "next/server";
import { renderTemplate, type TemplateContext } from "@/lib/notifications/templates";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import type { NotificationEvent } from "@/types";

interface WhatsAppBody {
  to: string;
  event?: NotificationEvent;
  context?: TemplateContext;
  message?: string;
}

/**
 * Dispatch a single WhatsApp message via the WhatsApp Cloud API. When `event`
 * is supplied the body is rendered from the shared notification templates
 * (`.whatsapp`); otherwise the raw `message` is sent. The provider degrades
 * gracefully when unconfigured.
 */
export async function POST(req: Request) {
  let body: WhatsAppBody;
  try {
    body = (await req.json()) as WhatsAppBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { to, event, context, message } = body;

  if (!to) {
    return NextResponse.json({ ok: false, error: "to is required" }, { status: 400 });
  }
  if (!event && !message) {
    return NextResponse.json(
      { ok: false, error: "Either event or message is required" },
      { status: 400 },
    );
  }

  const text = event
    ? renderTemplate(event, {
        supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE,
        supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
        ...(context ?? {}),
      }).whatsapp
    : (message as string);

  const result = await sendWhatsApp(to, text);

  return NextResponse.json({ ok: result.ok, result });
}
