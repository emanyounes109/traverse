"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import type { InternProfile, Paginated, Program } from "@/types/api";
import type { Application } from "@/types/applications";
import type { DocumentMeta } from "@/types/documents";

export interface OpenProgramsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: "applicationCloseDate" | "createdAt" | "name";
  order?: "asc" | "desc";
}

// Only OPEN programs whose application window includes now
export function useOpenPrograms(params: OpenProgramsParams) {
  return useQuery({
    queryKey: ["open-programs", params],
    queryFn: () => api<Paginated<Program>>("/programs", { query: { ...params } }),
    placeholderData: keepPreviousData,
  });
}

// The intern's applications (max page size), used to mark programs as applied
export function useMyApplications() {
  return useQuery({
    queryKey: ["my-applications"],
    queryFn: () => api<Paginated<Application>>("/applications/me", { query: { limit: 100 } }),
  });
}

export function useApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) =>
      api<Application>("/applications", { method: "POST", body: { programId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-applications"] }),
  });
}

// The intern's current CV (metadata only), if one is uploaded
export function useMyCv() {
  const { me } = useAuth();
  const cvId = me?.user.role === "INTERN" ? (me.profile as InternProfile).cvDocumentId : null;

  const query = useQuery({
    queryKey: ["document", cvId],
    queryFn: () => api<DocumentMeta>(`/documents/${cvId}`),
    enabled: !!cvId,
  });

  return { hasCv: !!cvId, cv: query.data };
}