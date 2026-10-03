"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { NotificationsResponse } from "@/types/notifications";

const POLL_MS = 30_000;

// limit 1 is enough when only the unread count is needed
export function useNotifications(limit: number, enabled = true) {
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: () => api<NotificationsResponse>("/notifications", { query: { page: 1, limit } }),
    placeholderData: keepPreviousData,
    refetchInterval: POLL_MS,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}