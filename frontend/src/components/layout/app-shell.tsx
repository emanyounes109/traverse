"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import type { Role } from "@/types/api";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter();
  const { me, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in: go to login
    if (!me) {
      router.replace("/login");
      return;
    }

    // Logged in with the other role: send to their own area
    if (me.user.role !== role) {
      router.replace(me.user.role === "INTERN" ? "/intern/dashboard" : "/staff/dashboard");
    }
  }, [isLoading, me, role, router]);

  // Show a spinner until we know the user may stay on this page
  if (isLoading || !me || me.user.role !== role) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-5">{children}</main>
      </div>
    </div>
  );
}