import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function InternLayout({ children }: { children: ReactNode }) {
  return <AppShell role="INTERN">{children}</AppShell>;
}