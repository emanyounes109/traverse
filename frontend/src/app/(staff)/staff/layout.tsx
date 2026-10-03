import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <AppShell role="STAFF">{children}</AppShell>;
}