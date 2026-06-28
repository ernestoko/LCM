"use client";

import { orderBy, where } from "firebase/firestore";
import { create, update } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import type { NotificationRecord } from "@/types";

export type NewNotification = Omit<
  NotificationRecord,
  "id" | "status" | "read" | "createdAt" | "createdBy"
> & { status?: NotificationRecord["status"]; read?: boolean };

/** Persist an in-app notification record (also written for sent email/SMS). */
export async function logNotification(data: NewNotification): Promise<string> {
  return create<Partial<NotificationRecord>>(COLLECTIONS.notifications, {
    ...data,
    status: data.status ?? "queued",
    read: data.read ?? false,
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await update<NotificationRecord>(COLLECTIONS.notifications, id, { read: true, status: "read" });
}

export function useUserNotifications(userId: string | null | undefined) {
  return useCollection<NotificationRecord>(
    COLLECTIONS.notifications,
    userId ? [where("recipientUserId", "==", userId), orderBy("createdAt", "desc")] : [],
    { enabled: Boolean(userId), deps: ["user-notifications", userId] },
  );
}

export function useNotifications() {
  return useCollection<NotificationRecord>(COLLECTIONS.notifications, [orderBy("createdAt", "desc")]);
}
