"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isCustomer } from "@/lib/auth/permissions";
import { NAV_SECTIONS, CUSTOMER_NAV_SECTIONS, type NavItem } from "@/constants/nav";
import { LogoWordmark } from "@/components/brand/Logo";
import { Icon } from "./Icon";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { role, can } = useAuth();

  const sections = isCustomer(role) ? CUSTOMER_NAV_SECTIONS : NAV_SECTIONS;

  const visible = (item: NavItem) => {
    if (item.roles && role && !item.roles.includes(role)) return false;
    if (item.permission && !can(item.permission)) return false;
    return true;
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-navy-950/40 transition-opacity lg:hidden print:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-navy-100 bg-white transition-transform lg:translate-x-0 print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-navy-100 px-4">
          <Link href="/dashboard" onClick={onClose}>
            <LogoWordmark />
          </Link>
          <button onClick={onClose} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {sections.map((section, i) => {
            const items = section.items.filter(visible);
            if (items.length === 0) return null;
            return (
              <div key={i}>
                {section.heading && (
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                    {section.heading}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-brand-50 font-semibold text-brand-700"
                              : "font-medium text-navy-600 hover:bg-navy-50 hover:text-navy-900",
                          )}
                        >
                          {active && (
                            <span
                              className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600"
                              aria-hidden="true"
                            />
                          )}
                          <Icon
                            name={item.icon}
                            className={cn(
                              "h-4.5 w-4.5 shrink-0 transition-colors",
                              active ? "text-brand-600" : "text-navy-400 group-hover:text-navy-600",
                            )}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-navy-100 px-4 py-3">
          <p className="text-[11px] text-navy-400">
            &copy; {new Date().getFullYear()} Liberty &amp; Liberty Logistics
          </p>
        </div>
      </aside>
    </>
  );
}
