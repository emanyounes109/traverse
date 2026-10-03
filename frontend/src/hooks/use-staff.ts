"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated, Permission } from "@/types/api";
import type { ManagedStaff, PendingStaff } from "@/types/staff";

interface PageParams {
  page: number;
  limit: number;
}

// Staff waiting for approval (needs CAN_MANAGE_USERS)
export function usePendingStaff(params: PageParams, enabled = true) {
  return useQuery({
    queryKey: ["staff-pending", params],
    queryFn: () => api<Paginated<PendingStaff>>("/staff/pending", { query: { ...params } }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

// Active staff with their permissions (needs CAN_MANAGE_USERS)
export function useActiveStaff(params: PageParams & { search?: string }, enabled = true) {
  return useQuery({
    queryKey: ["staff-active", params],
    queryFn: () => api<Paginated<ManagedStaff>>("/staff", { query: { ...params } }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

function useRefreshStaff() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["staff-pending"] }),
      qc.invalidateQueries({ queryKey: ["staff-active"] }),
      qc.invalidateQueries({ queryKey: ["staff-options"] }),
    ]);
}

export function useApproveStaff() {
  const refresh = useRefreshStaff();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: Permission[] }) =>
      api(`/staff/${id}/approve`, { method: "PATCH", body: { permissions } }),
    onSuccess: refresh,
  });
}

export function useRejectStaff() {
  const refresh = useRefreshStaff();
  return useMutation({
    mutationFn: (id: string) => api(`/staff/${id}/reject`, { method: "PATCH" }),
    onSuccess: refresh,
  });
}

// Replaces the full permission set (not a merge)
export function useUpdateStaffPermissions() {
  const refresh = useRefreshStaff();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: Permission[] }) =>
      api(`/staff/${id}/permissions`, { method: "PATCH", body: { permissions } }),
    onSuccess: refresh,
  });
}