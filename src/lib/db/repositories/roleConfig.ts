"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { Role } from "@/types";

/**
 * Stores which modules each role is granted. Lives in `settings/roleModules` as
 * `{ roles: { [role]: moduleKey[] } }`. A role with no entry uses its static
 * defaults, so the platform behaves unchanged until a Super Admin customises it.
 */
export type RoleModules = Partial<Record<Role, string[]>>;

const docRef = () => doc(getDb(), "settings", "roleModules");

/** One-shot read used by the auth provider. Safe: returns {} on any error. */
export async function getRoleModules(): Promise<RoleModules> {
  try {
    const snap = await getDoc(docRef());
    return (snap.data()?.roles as RoleModules) ?? {};
  } catch {
    return {};
  }
}

/** Live subscription used by the management page. */
export function useRoleModules() {
  const [roleModules, setRoleModules] = useState<RoleModules>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(
      docRef(),
      (snap) => {
        setRoleModules((snap.data()?.roles as RoleModules) ?? {});
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);
  return { roleModules, loading };
}

/** Persist a role's granted module keys (Super Admin only). */
export async function saveRoleModules(
  role: Role,
  moduleKeys: string[],
  actor: { uid: string },
): Promise<void> {
  await setDoc(
    docRef(),
    {
      roles: { [role]: moduleKeys },
      updatedAt: new Date().toISOString(),
      updatedBy: actor.uid,
    },
    { merge: true },
  );
}
