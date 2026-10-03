"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/types/api";
import type { InternshipStatus } from "@/types/internships";
import type {
  InternDetail,
  InternListItem,
  InternshipHistoryEntry,
  MentorWorkload,
} from "@/types/interns";

export interface InternsParams {
  page: number;
  limit: number;
  search?: string;
  // Program id
  program?: string;
  // Mentor (staff user) id
  mentor?: string;
  status?: InternshipStatus | "";
  sortBy?: "fullName" | "progress" | "status" | "startedAt" | "createdAt";
  order?: "asc" | "desc";
}

export function useInterns(params: InternsParams, enabled = true) {
  return useQuery({
    queryKey: ["interns", params],
    queryFn: () => api<Paginated<InternListItem>>("/interns", { query: { ...params } }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

// The id is the intern USER id
export function useIntern(id: string) {
  return useQuery({
    queryKey: ["intern", id],
    queryFn: () => api<InternDetail>(`/interns/${id}`),
    enabled: !!id,
  });
}

export function useInternshipHistory(internshipId?: string) {
  return useQuery({
    queryKey: ["internship-history", internshipId],
    queryFn: () => api<InternshipHistoryEntry[]>(`/internships/${internshipId}/history`),
    enabled: !!internshipId,
  });
}

// Mentors with their current load (needs CAN_ASSIGN_MENTOR or CAN_VIEW_ALL_INTERNS)
export function useMentorWorkload(enabled = true) {
  return useQuery({
    queryKey: ["staff-workload"],
    queryFn: () => api<MentorWorkload[]>("/staff/workload"),
    enabled,
  });
}

function useRefreshInterns() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["interns"] }),
      qc.invalidateQueries({ queryKey: ["intern"] }),
      qc.invalidateQueries({ queryKey: ["internship-history"] }),
      qc.invalidateQueries({ queryKey: ["staff-workload"] }),
      qc.invalidateQueries({ queryKey: ["my-internship"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}

export interface StatusChangeResult {
  warning?: string;
  incompleteTaskCount?: number;
}

export function useChangeInternshipStatus(internshipId: string) {
  const refresh = useRefreshInterns();
  return useMutation({
    mutationFn: (body: { toStatus: string; reason?: string }) =>
      api<StatusChangeResult>(`/internships/${internshipId}/status`, { method: "PATCH", body }),
    onSuccess: refresh,
  });
}

// Replaces the current mentor if there is one
export function useAssignMentor(internshipId: string) {
  const refresh = useRefreshInterns();
  return useMutation({
    mutationFn: (staffId: string) =>
      api<{ warning?: string }>(`/internships/${internshipId}/mentor`, {
        method: "POST",
        body: { staffId },
      }),
    onSuccess: refresh,
  });
}