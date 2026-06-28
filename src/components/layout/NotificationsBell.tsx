"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUserNotifications, markNotificationRead } from "@/lib/db/repositories/notifications";
import { fromNow } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

export function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data } = useUserNotifications(user?.id);
  const unread = data.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-navy-500 hover:bg-navy-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-card-hover">
            <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
              <p className="text-sm font-semibold text-navy-900">Notifications</p>
              {unread > 0 && <span className="text-xs text-navy-400">{unread} unread</span>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {data.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-navy-400">No notifications yet.</p>
              ) : (
                data.slice(0, 15).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 border-b border-navy-50 px-4 py-3 text-left hover:bg-navy-50",
                      !n.read && "bg-brand-50/40",
                    )}
                  >
                    {n.subject && <p className="text-sm font-medium text-navy-900">{n.subject}</p>}
                    <p className="line-clamp-2 text-xs text-navy-600">{n.body}</p>
                    <p className="text-[10px] text-navy-400">{fromNow(n.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
