"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { waLink } from "@/lib/notifications/walink";
import { cn } from "@/lib/utils/cn";

export interface WhatsAppButtonProps {
  /** Recipient phone number (any format; normalised to intl). */
  phone: string;
  /** Optional pre-filled message. */
  message?: string;
  /** Button label. Defaults to "WhatsApp". */
  label?: string;
  className?: string;
}

/**
 * Opens a WhatsApp click-to-chat conversation with the given number in a new
 * tab. Renders as a small green WhatsApp-style outline button. Disabled (no-op)
 * when no phone number is provided.
 */
export function WhatsAppButton({ phone, message, label = "WhatsApp", className }: WhatsAppButtonProps) {
  const disabled = !phone.trim();

  const handleClick = () => {
    if (disabled) return;
    window.open(waLink(phone, message), "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "border-emerald-500 text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-400",
        className,
      )}
      aria-label={`Chat with ${phone || "contact"} on WhatsApp`}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </Button>
  );
}
