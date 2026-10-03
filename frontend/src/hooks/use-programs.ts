"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  Paginated,
  Program,
  ProgramAction,
  ProgramInput,
  ProgramStatus,
  ProgramUpdate,
} from "@/types/api";

export interface ProgramsParams {
  page: number;
  limit: number;
  search?: string;
  status?: ProgramStatus | "";
}

// Staff list: all programs, any status
export function usePrograms(params: ProgramsParams) {
  return useQuery({
    queryKey: ["programs", params],
    queryFn: () => api<Paginated<Program>>("/staff/programs", { query: { ...params } }),
    placeholderData: keepPreviousData,
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ["program", id],
    queryFn: () => api<Program>(`/programs/${id}`),
    enabled: !!id,
  });
}

// Total applications received (needs CAN_REVIEW_APPLICATIONS, so it can be disabled)
export function useApplicationsCount(programId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["applications-count", programId],
    queryFn: async () => {
      const res = await api<Paginated<unknown>>("/applications", {
        query: { programId, limit: 1 },
      });
      return res.meta.total;
    },
    enabled: enabled && !!programId,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProgramInput) => api<Program>("/programs", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });
}

export function useUpdateProgram(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProgramUpdate) => api<Program>(`/programs/${id}`, { method: "PATCH", body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["program", id] });
      await qc.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}

// publish | close | start | complete | archive
export function useProgramAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: ProgramAction) =>
      api<Program>(`/programs/${id}/${action}`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["program", id] });
      await qc.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}