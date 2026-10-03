"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { NAV } from "@/config/navigation";
import { getInitials } from "@/lib/initials";

export function Sidebar() {
  const pathname = usePathname();
  const { me, logout, hasPermission } = useAuth();

  if (!me) return null;

  const role = me.user.role;

  // Keep only the items this user is allowed to see
  const items = NAV[role].filter(
    (item) => !item.anyOf || item.anyOf.some((p) => hasPermission(p))
  );

  return (
    <aside className="flex h-full w-16 shrink-0 flex-col items-center bg-brand py-3">
      {/* Logo */}
      <Link
        href={`/${role.toLowerCase()}/dashboard`}
        aria-label="Traverse home"
        className="mb-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/40 font-heading text-base font-bold text-white"
      >
        T
      </Link>

      {/* Navigation: scrolls on short screens so the bottom section is never pushed out of view */}
      <nav className="flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition ${
                active
                  ? "bg-nav-active text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: always visible */}
      <div className="mt-2 flex w-full shrink-0 flex-col items-center gap-2 border-t border-white/15 pt-3">
        <div
          title={me.profile.fullName}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary"
        >
          {getInitials(me.profile.fullName)}
        </div>
        <button
          type="button"
          onClick={() => logout()}
          title="Log out"
          aria-label="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-md text-white/80 transition hover:bg-danger/25 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </aside>
  );
}