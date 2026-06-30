import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/assistant/knowledgeContext";
import { consumeRateLimit, clientIp } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OPTIONAL Claude-backed assistant layer. The deterministic local knowledge base
 * (lib/assistant/brain) handles the vast majority of questions instantly and
 * with zero AI. This route is only called by the chat widget as a fallback when
 * the local brain has no confident answer — and only does anything when an
 * ANTHROPIC_API_KEY is configured. Without a key it reports `configured: false`
 * and the widget shows its friendly catch-all, so the platform never depends on
 * AI to function. The model is tightly grounded in the same knowledge base and
 * guard-railed to the shipping domain (see buildSystemPrompt).
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

interface ChatBody {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Not an error — the assistant simply runs on its local brain.
    return NextResponse.json({ ok: false, configured: false });
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ ok: false, configured: true, error: "Invalid request." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ ok: false, configured: true, error: "Empty message." }, { status: 400 });
  }

  // Throttle the (paid) AI path per IP.
  const limit = await consumeRateLimit(`assistant-chat:${clientIp(req)}`, 20, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, configured: true, error: "You're sending messages quickly — give me a moment 🙂" },
      { status: 429 },
    );
  }

  // Keep only the last few turns for context, capped in length.
  const history = (body.history ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 500,
        temperature: 0.3,
        system: buildSystemPrompt(),
        messages: [...history, { role: "user", content: message.slice(0, 1500) }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, configured: true, error: "The assistant is busy right now." },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) {
      return NextResponse.json({ ok: false, configured: true, error: "No answer." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, configured: true, text });
  } catch {
    return NextResponse.json(
      { ok: false, configured: true, error: "Couldn't reach the assistant." },
      { status: 503 },
    );
  }
}
