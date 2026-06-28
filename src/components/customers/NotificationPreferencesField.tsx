"use client";

import { Checkbox } from "@/components/ui";

export interface NotificationPreferencesValue {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export interface NotificationPreferencesFieldProps {
  value?: NotificationPreferencesValue;
  onChange: (value: NotificationPreferencesValue) => void;
}

const DEFAULT_VALUE: NotificationPreferencesValue = {
  email: true,
  sms: true,
  whatsapp: false,
};

/**
 * Controlled editor for a customer's per-channel notification opt-ins.
 *
 * In-app notifications are always on, so only Email, SMS and WhatsApp are
 * toggleable here. Defaults to email + SMS on (WhatsApp off) when `value` is
 * undefined, matching the platform's default channels.
 */
export function NotificationPreferencesField({
  value,
  onChange,
}: NotificationPreferencesFieldProps) {
  const current = value ?? DEFAULT_VALUE;

  const update = (patch: Partial<NotificationPreferencesValue>) => {
    onChange({ ...current, ...patch });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Checkbox
          label="Email"
          checked={current.email}
          onChange={(e) => update({ email: e.target.checked })}
        />
        <Checkbox
          label="SMS"
          checked={current.sms}
          onChange={(e) => update({ sms: e.target.checked })}
        />
        <Checkbox
          label="WhatsApp"
          checked={current.whatsapp}
          onChange={(e) => update({ whatsapp: e.target.checked })}
        />
      </div>
      <p className="text-xs text-navy-400">
        In-app notifications are always on.
      </p>
    </div>
  );
}
