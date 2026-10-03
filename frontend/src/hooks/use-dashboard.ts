"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { InternDashboard, StaffDashboard } from "@/types/dashboard";

export function useInternDashboard(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "intern"],
    queryFn: () => api<InternDashboard>("/dashboard/intern"),
    enabled,
  });
}

export function useStaffDashboard(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "staff"],
    queryFn: () => api<StaffDashboard>("/dashboard/staff"),
    enabled,
  });
}