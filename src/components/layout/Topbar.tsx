"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABELS } from "@/constants/roles";
import { Avatar } from "@/components/ui";
import { NotificationsBell } from "./NotificationsBell";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-navy-100 bg-white/90 px-4 backdrop-blur lg:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-navy-500 hover:bg-navy-100 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <NotificationsBell />

      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-navy-50"
        >
          <Avatar name={user?.displayName} src={user?.photoURL} />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-navy-900">{user?.displayName ?? "User"}</p>
            <p className="text-xs text-navy-400">{role ? ROLE_LABELS[role] : ""}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-navy-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-card-hover">
              <div className="border-b border-navy-100 px-4 py-3">
                <p className="text-sm font-medium text-navy-900">{user?.displayName}</p>
                <p className="truncate text-xs text-navy-400">{user?.email}</p>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
