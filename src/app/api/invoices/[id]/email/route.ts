import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { sendEmail } from "@/lib/notifications/email";
import { COLLECTIONS } from "@/lib/db/collections";
import { formatMoney } from "@/lib/utils/format";
import type { Invoice, InvoiceLine, Customer, CurrencyCode } from "@/types";

/**
 * POST /api/invoices/[id]/email
 * ---------------------------------------------------------------------------
 * Email an invoice to a customer. Staff-only: requires a signed-in Liberty /
 * Finance caller (custom claim `org === "liberty"`) OR a Liberty Super Admin
 * (`role === "liberty_super_admin"`). The recipient is taken from the request
 * body `to` field if present, otherwise from the linked customer's email.
 */

interface EmailInvoiceBody {
  to?: string;
}

interface StaffCaller {
  uid: string;
  isSuperAdmin: boolean;
}

/** Verify the caller is signed-in Liberty/Finance staff or a Super Admin. */
async function requireStaff(req: Request): Promise<StaffCaller | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const isLiberty = decoded.org === "liberty";
    const isSuperAdmin = decoded.role === "liberty_super_admin";
    if (!isLiberty && !isSuperAdmin) return null;
    return { uid: decoded.uid, isSuperAdmin };
  } catch {
    return null;
  }
}

const SEAL_RATE_NOTE =
  "All charges on this invoice are calculated from our approved rate card in effect on the rate-card effective date shown above.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLineRowsHtml(lines: InvoiceLine[], currency: CurrencyCode): string {
  if (lines.length === 0) {
    return `<tr><td colspan="4" style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0">No line items.</td></tr>`;
  }
  return lines
    .map((line, idx) => {
      const stripe = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      return `<tr style="background:${stripe}">
        <td style="padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0f1b3d;border-top:1px solid #e2e8f0">${escapeHtml(
          line.description,
        )}</td>
        <td align="center" style="padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0f1b3d;border-top:1px solid #e2e8f0">${line.quantity}</td>
        <td align="right" style="padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0f1b3d;border-top:1px solid #e2e8f0">${escapeHtml(
          formatMoney(line.unitPrice, currency),
        )}</td>
        <td align="right" style="padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0f1b3d;font-weight:600;border-top:1px solid #e2e8f0">${escapeHtml(
          formatMoney(line.amount, currency),
        )}</td>
      </tr>`;
    })
    .join("");
}

function summaryRowHtml(
  label: string,
  value: string,
  opts: { strong?: boolean; accent?: boolean } = {},
): string {
  const weight = opts.strong ? "700" : "400";
  const color = opts.accent ? "#0f1b3d" : "#334155";
  const size = opts.strong ? "15px" : "13px";
  return `<tr>
    <td align="right" style="padding:6px 14px;font-family:Arial,Helvetica,sans-serif;font-size:${size};font-weight:${weight};color:${color}">${escapeHtml(
      label,
    )}</td>
    <td align="right" width="140" style="padding:6px 14px;font-family:Arial,Helvetica,sans-serif;font-size:${size};font-weight:${weight};color:${color}">${escapeHtml(
      value,
    )}</td>
  </tr>`;
}

function buildHtml(invoice: Invoice): string {
  const currency = invoice.currency;
  const linesHtml = buildLineRowsHtml(invoice.lines, currency);

  const summaryRows = [
    summaryRowHtml("Subtotal", formatMoney(invoice.subtotal, currency)),
    summaryRowHtml("Service fee", formatMoney(invoice.serviceFee, currency)),
  ];
  if (invoice.additionalCharges) {
    summaryRows.push(
      summaryRowHtml("Additional charges", formatMoney(invoice.additionalCharges, currency)),
    );
  }
  summaryRows.push(
    summaryRowHtml("Total", formatMoney(invoice.total, currency), { strong: true, accent: true }),
  );
  if (invoice.amountPaid) {
    summaryRows.push(summaryRowHtml("Amount paid", formatMoney(invoice.amountPaid, currency)));
  }
  summaryRows.push(
    summaryRowHtml("Balance due", formatMoney(invoice.balanceDue, currency), {
      strong: true,
      accent: true,
    }),
  );

  const paymentInstructionsHtml = invoice.paymentInstructions
    ? `<tr><td style="padding:18px 24px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:8px">
          <tr><td style="padding:14px 16px">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#475569;margin-bottom:6px">Payment instructions</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0f1b3d;line-height:1.6;white-space:pre-line">${escapeHtml(
              invoice.paymentInstructions,
            )}</div>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <tr>
            <td style="background:#0f1b3d;padding:22px 24px">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:.01em">Liberty &amp; Liberty Logistics</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#aab4cf;margin-top:4px">Invoice ${escapeHtml(
                invoice.invoiceNumber,
              )}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#334155;line-height:1.7;vertical-align:top">
                    <div style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8">Billed to</div>
                    <div style="font-size:15px;font-weight:600;color:#0f1b3d;margin-top:2px">${escapeHtml(
                      invoice.customerName,
                    )}</div>
                  </td>
                  <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#334155;line-height:1.7;vertical-align:top">
                    <div><span style="color:#94a3b8">Tracking:</span> <span style="font-weight:600;color:#0f1b3d">${escapeHtml(
                      invoice.trackingNumber,
                    )}</span></div>
                    <div><span style="color:#94a3b8">Route:</span> <span style="font-weight:600;color:#0f1b3d">${escapeHtml(
                      invoice.routeCode,
                    )}</span></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
                <tr style="background:#0f1b3d">
                  <th align="left" style="padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#ffffff">Description</th>
                  <th align="center" style="padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#ffffff">Qty</th>
                  <th align="right" style="padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#ffffff">Unit price</th>
                  <th align="right" style="padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#ffffff">Amount</th>
                </tr>
                ${linesHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px 0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${summaryRows.join("")}
              </table>
            </td>
          </tr>
          ${paymentInstructionsHtml}
          <tr>
            <td style="padding:18px 24px 0">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748b;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:14px">
                ${escapeHtml(SEAL_RATE_NOTE)}
                <div style="margin-top:6px"><span style="color:#94a3b8">Rate card:</span> ${escapeHtml(
                  invoice.rateCardName,
                )}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px 24px">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#94a3b8;line-height:1.6;text-align:center">
                Thank you for shipping with Liberty &amp; Liberty Logistics.<br />
                This is an automated message regarding invoice ${escapeHtml(invoice.invoiceNumber)}.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(invoice: Invoice): string {
  const currency = invoice.currency;
  const lines = [
    "Liberty & Liberty Logistics",
    `Invoice ${invoice.invoiceNumber}`,
    "",
    `Billed to: ${invoice.customerName}`,
    `Tracking: ${invoice.trackingNumber}`,
    `Route: ${invoice.routeCode}`,
    "",
    "Line items:",
  ];

  if (invoice.lines.length === 0) {
    lines.push("  (none)");
  } else {
    for (const line of invoice.lines) {
      lines.push(
        `  - ${line.description} x${line.quantity} @ ${formatMoney(
          line.unitPrice,
          currency,
        )} = ${formatMoney(line.amount, currency)}`,
      );
    }
  }

  lines.push("");
  lines.push(`Subtotal: ${formatMoney(invoice.subtotal, currency)}`);
  lines.push(`Service fee: ${formatMoney(invoice.serviceFee, currency)}`);
  if (invoice.additionalCharges) {
    lines.push(`Additional charges: ${formatMoney(invoice.additionalCharges, currency)}`);
  }
  lines.push(`Total: ${formatMoney(invoice.total, currency)}`);
  if (invoice.amountPaid) {
    lines.push(`Amount paid: ${formatMoney(invoice.amountPaid, currency)}`);
  }
  lines.push(`Balance due: ${formatMoney(invoice.balanceDue, currency)}`);
  lines.push("");

  if (invoice.paymentInstructions) {
    lines.push("Payment instructions:");
    lines.push(invoice.paymentInstructions);
    lines.push("");
  }

  lines.push(SEAL_RATE_NOTE);
  lines.push(`Rate card: ${invoice.rateCardName}`);
  lines.push("");
  lines.push("Thank you for shipping with Liberty & Liberty Logistics.");

  return lines.join("\n");
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!isAdminConfigured) {
    return NextResponse.json(
      { ok: false, error: "Admin SDK not configured." },
      { status: 503 },
    );
  }

  const caller = await requireStaff(req);
  if (!caller) {
    return NextResponse.json(
      { ok: false, error: "Forbidden — Liberty/Finance staff only." },
      { status: 403 },
    );
  }

  let body: EmailInvoiceBody = {};
  try {
    const raw = await req.text();
    if (raw.trim()) body = JSON.parse(raw) as EmailInvoiceBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const invoiceSnap = await db.collection(COLLECTIONS.invoices).doc(params.id).get();
    if (!invoiceSnap.exists) {
      return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 });
    }
    const invoice = { id: invoiceSnap.id, ...(invoiceSnap.data() as Omit<Invoice, "id">) };

    // Resolve recipient. A custom `to` is honoured ONLY for a Super Admin —
    // other staff can only send to the customer's email on file, so a low-
    // privilege user cannot exfiltrate an invoice to an arbitrary address.
    let recipient = caller.isSuperAdmin && typeof body.to === "string" ? body.to.trim() : "";
    if (!recipient && invoice.customerId) {
      const customerSnap = await db
        .collection(COLLECTIONS.customers)
        .doc(invoice.customerId)
        .get();
      if (customerSnap.exists) {
        const customer = customerSnap.data() as Partial<Customer>;
        recipient = (customer.email ?? "").trim();
      }
    }

    if (!recipient) {
      return NextResponse.json(
        { ok: false, error: "No recipient email on file." },
        { status: 400 },
      );
    }

    const subject = `Invoice ${invoice.invoiceNumber} — Liberty & Liberty Logistics`;
    const html = buildHtml(invoice);
    const text = buildText(invoice);

    const result = await sendEmail({ to: recipient, subject, text, html });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "Failed to send email." },
        { status: 502 },
      );
    }

    await db
      .collection(COLLECTIONS.invoices)
      .doc(params.id)
      .set(
        {
          emailedAt: new Date().toISOString(),
          emailedTo: recipient,
        },
        { merge: true },
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to email invoice.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
