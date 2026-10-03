import {
  LayoutDashboard,
  Briefcase,
  FileText,
  GraduationCap,
  ListChecks,
  FolderOpen,
  Users,
  UserCog,
  CalendarDays,
  Layers,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission, Role } from "@/types/api";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // Item is visible if the user holds at least one of these permissions
  anyOf?: Permission[];
}

export const NAV: Record<Role, NavItem[]> = {
  INTERN: [
    { label: "Dashboard", href: "/intern/dashboard", icon: LayoutDashboard },
    { label: "Programs", href: "/intern/programs", icon: Briefcase },
    { label: "My applications", href: "/intern/applications", icon: FileText },
    { label: "My tasks", href: "/intern/tasks", icon: ListChecks },
    { label: "Documents", href: "/intern/documents", icon: FolderOpen },
  ],
  STAFF: [
    { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    { label: "Team", href: "/staff/team", icon: UserCog, anyOf: ["CAN_MANAGE_USERS"] },
    { label: "Programs", href: "/staff/programs", icon: Layers, anyOf: ["CAN_MANAGE_PROGRAMS"] },
    {
      label: "Applications",
      href: "/staff/applications",
      icon: FileText,
      anyOf: ["CAN_REVIEW_APPLICATIONS"],
    },
    {
      label: "Interviews",
      href: "/staff/interviews",
      icon: CalendarDays,
      anyOf: ["CAN_MANAGE_INTERVIEWS", "CAN_REVIEW_APPLICATIONS"],
    },
    { label: "Interns", href: "/staff/interns", icon: Users },
    {
      label: "Mentors",
      href: "/staff/mentors",
      icon: GraduationCap,
      anyOf: ["CAN_ASSIGN_MENTOR", "CAN_VIEW_ALL_INTERNS"],
    },
    { label: "Tasks", href: "/staff/tasks", icon: ListChecks },
    { label: "Audit", href: "/staff/audit", icon: ShieldCheck, anyOf: ["CAN_VIEW_AUDIT"] },
  ],
};