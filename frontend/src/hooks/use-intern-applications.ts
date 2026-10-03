"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/types/api";
import type { Application, ApplicationDetail } from "@/types/applications";

// Keys start with "my-applications" so applying invalidates them together with the other lists
export function useMyApplicationsPage(page: number, limit: number) {
  return useQuery({
    queryKey: ["my-applications", "page", page, limit],
    queryFn: () => api<Paginated<Application>>("/applications/me", { query: { page, limit } }),
    placeholderData: keepPreviousData,
  });
}

export function useMyApplication(id: string) {
  return useQuery({
    queryKey: ["my-applications", "detail", id],
    queryFn: () => api<ApplicationDetail>(`/applications/${id}`),
    enabled: !!id,
  });
}