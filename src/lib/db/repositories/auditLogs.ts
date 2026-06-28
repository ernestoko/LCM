"use client";

import { orderBy, limit } from "firebase/firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import type { AuditLogEntry } from "@/types";

export function useAuditLogs(max = 200) {
  return useCollection<AuditLogEntry>(COLLECTIONS.auditLogs, [
    orderBy("at", "desc"),
    limit(max),
  ]);
}
