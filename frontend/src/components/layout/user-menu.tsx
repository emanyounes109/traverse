"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { getInitials } from "@/lib/initials";

export function UserMenu() {
  const { me, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!me) return null;

  const fullName = me.profile.fullName;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary transition hover:ring-2 hover:ring-primary/20"
      >
        {getInitials(fullName)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-40 w-56 rounded-lg border border-line bg-surface p-1.5 shadow-lg"
        >
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{fullName}</p>
            <p className="truncate text-xs text-muted">{me.user.email}</p>
            <p className="mt-1 font-mono text-[10px] uppercase text-muted">
              {me.user.role === "INTERN" ? "Intern" : "Staff"}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => logout()}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger transition hover:bg-danger/5"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}