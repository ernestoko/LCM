"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/db/collections";
import type { AppUser, Role } from "@/types";
import type { Permission } from "./permissions";
import { effectivePermissions } from "@/constants/modules";
import { getRoleModules, type RoleModules } from "@/lib/db/repositories/roleConfig";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: AppUser | null;
  role: Role | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  /** Surfaced when a session ends for a reason (deactivated / idle timeout). */
  authNotice: string | null;
  clearAuthNotice: () => void;
}

/**
 * Idle-session timeout (minutes) for STAFF logins. After this much inactivity a
 * staff session is signed out for security. 0 disables it. Customers are exempt.
 */
const IDLE_TIMEOUT_MIN = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MIN ?? "60");

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Super-admin-managed role -> module grants; empty means "use static defaults".
  const [roleModules, setRoleModules] = useState<RoleModules>({});
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const configured = isFirebaseConfigured;

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const db = getDb();
        const ref = doc(db, COLLECTIONS.users, fbUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const profile = { id: fbUser.uid, ...(snap.data() as Omit<AppUser, "id">) };
          // Deactivated accounts must not get a session, even with valid creds.
          if (profile.active === false) {
            setAuthNotice("Your account has been deactivated. Please contact your administrator.");
            setUser(null);
            await fbSignOut(auth);
            setLoading(false);
            return;
          }
          setUser(profile);
          // Best-effort last-login stamp.
          void setDoc(ref, { lastLoginAt: new Date().toISOString() }, { merge: true });
          // Load the Super-Admin-managed role -> module config (safe: {} on failure).
          void getRoleModules().then(setRoleModules);
        } else {
          // Auth user with no profile doc yet — treat as unprovisioned.
          setUser(null);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load user profile", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [configured]);

  // Idle-session timeout for staff — signs out after inactivity for security.
  useEffect(() => {
    if (!user || user.organization === "customer") return;
    if (!Number.isFinite(IDLE_TIMEOUT_MIN) || IDLE_TIMEOUT_MIN <= 0) return;
    const timeoutMs = IDLE_TIMEOUT_MIN * 60_000;
    let timer: ReturnType<typeof setTimeout>;
    const expire = () => {
      setAuthNotice("You were signed out after a period of inactivity.");
      void fbSignOut(getFirebaseAuth());
    };
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(expire, timeoutMs);
    };
    // Throttle so we don't reset the timer on every mousemove pixel.
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last < 1000) return;
      last = now;
      reset();
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(() => {
    const role = user?.role ?? null;
    // Effective permissions: custom module grants if the Super Admin has set
    // them for this role, otherwise the role's static defaults.
    const perms = effectivePermissions(role, roleModules);
    return {
      firebaseUser,
      user,
      role,
      loading,
      configured,
      can: (p: Permission) => perms.includes(p),
      canAny: (ps: Permission[]) => ps.some((p) => perms.includes(p)),
      signIn: async (email, password) => {
        setAuthNotice(null);
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      signOut: async () => {
        await fbSignOut(getFirebaseAuth());
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(getFirebaseAuth(), email);
      },
      authNotice,
      clearAuthNotice: () => setAuthNotice(null),
    };
  }, [firebaseUser, user, loading, configured, roleModules, authNotice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/** Convenience hook returning the current actor for repository writes. */
export function useActor() {
  const { user } = useAuth();
  return user
    ? { uid: user.id, name: user.displayName, role: user.role }
    : { uid: "anonymous", name: "Anonymous" };
}
