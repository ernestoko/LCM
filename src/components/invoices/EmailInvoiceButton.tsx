"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui";
import { getFirebaseAuth } from "@/lib/firebase/client";

interface EmailInvoiceButtonProps {
  invoiceId: string;
  defaultEmail?: string;
  className?: string;
}

interface EmailInvoiceResponse {
  ok: boolean;
  error?: string;
}

export function EmailInvoiceButton({
  invoiceId,
  defaultEmail,
  className,
}: EmailInvoiceButtonProps) {
  const { success, error } = useToast();
  const [sending, setSending] = useState(false);

  async function handleClick() {
    if (sending) return;
    setSending(true);
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      if (!token) {
        error("You must be signed in to email an invoice.");
        return;
      }

      const res = await fetch(`/api/invoices/${invoiceId}/email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(defaultEmail ? { to: defaultEmail } : {}),
      });

      let data: EmailInvoiceResponse;
      try {
        data = (await res.json()) as EmailInvoiceResponse;
      } catch {
        data = { ok: false, error: "Unexpected server response." };
      }

      if (res.ok && data.ok) {
        success("Invoice emailed to the customer.");
      } else {
        error(data.error ?? "Failed to email the invoice.");
      }
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to email the invoice.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      loading={sending}
      disabled={sending}
      className={className}
    >
      {!sending && <Mail className="h-4 w-4" />}
      Email invoice
    </Button>
  );
}
