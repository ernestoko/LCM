"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LoadingState } from "@/components/ui";
import type { Permission } from "@/lib/auth/permissions";
import { ShieldX } from "lucide-react";

/** Blocks rendering until auth resolves; redirects unauthenticated users. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { firebaseUser, user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!configured) {
      router.replace("/setup");
      return;
    }
    if (!loading && !firebaseUser) router.replace("/login");
  }, [loading, firebaseUser, configured, router]);

  if (!configured) return null;
  if (loading) return <LoadingState label="Signing you in…" />;
  if (!firebaseUser) return <LoadingState label="Redirecting…" />;

  if (firebaseUser && !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <ShieldX className="mb-3 h-10 w-10 text-amber-500" />
        <h2 className="text-lg font-semibold text-navy-900">Account not provisioned</h2>
        <p className="mt-1 max-w-md text-sm text-navy-500">
          Your sign-in is valid but no platform profile is linked to it yet. Ask a Liberty Super
          Admin to provision your account with a role.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/** Renders children only if the user holds the permission; otherwise a notice. */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { can } = useAuth();
  if (!can(permission)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <ShieldX className="mb-3 h-10 w-10 text-red-400" />
        <h2 className="text-lg font-semibold text-navy-900">Access restricted</h2>
        <p className="mt-1 max-w-md text-sm text-navy-500">
          You don&apos;t have permission to view this section. If you believe this is an error,
          contact your administrator.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
