"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { NAV } from "@/config/navigation";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const pathname = usePathname();
  const { me } = useAuth();
  const [today, setToday] = useState("");

  // Set the date on the client only, to avoid server/client mismatch
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  if (!me) return null;

  const role = me.user.role;

  // Breadcrumb label comes from the nav item that matches the current URL
  const current = NAV[role].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const pageLabel = current?.label ?? (role === "INTERN" ? "My workspace" : "Staff workspace");

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <span className="text-muted">Traverse</span>
        <span className="text-muted">/</span>
        <span className="font-semibold text-ink">{pageLabel}</span>
      </nav>

      <div className="flex items-center gap-4">
        <span className="hidden font-mono text-xs text-muted sm:block">{today}</span>
        <span className="hidden h-5 w-px bg-line sm:block" />
        <NotificationBell role={role} />
        <UserMenu />
      </div>
    </header>
  );
}