"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated, Program } from "@/types/api";
import type {
  ApplicationDetail,
  ApplicationListItem,
  ApplicationStatus,
} from "@/types/applications";
import type { StaffMember } from "@/types/staff";

export interface ApplicationsParams {
  page: number;
  limit: number;
  search?: string;
  status?: ApplicationStatus | "";
  programId?: string;
  // YYYY-MM-DD
  appliedFrom?: string;
  appliedTo?: string;
}

export function useApplications(params: ApplicationsParams, enabled = true) {
  return useQuery({
    queryKey: ["applications", params],
    queryFn: () => api<Paginated<ApplicationListItem>>("/applications", { query: { ...params } }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useApplication(id: string, enabled = true) {
  return useQuery({
    queryKey: ["application", id],
    queryFn: () => api<ApplicationDetail>(`/applications/${id}`),
    enabled: enabled && !!id,
  });
}

export interface StatusChangeBody {
  toStatus: "UNDER_REVIEW" | "SHORTLISTED" | "REJECTED" | "ACCEPTED";
  note?: string;
}

export function useChangeApplicationStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StatusChangeBody) =>
      api<{ internshipId?: string }>(`/applications/${id}/status`, { method: "PATCH", body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["application", id] });
      await qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export interface ScheduleInterviewBody {
  interviewerId: string;
  // ISO string with timezone, in the future
  scheduledAt: string;
}

export function useScheduleInterview(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ScheduleInterviewBody) =>
      api(`/applications/${applicationId}/interviews`, { method: "POST", body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["application", applicationId] });
      await qc.invalidateQueries({ queryKey: ["applications"] });
      await qc.invalidateQueries({ queryKey: ["interviews"] });
    },
  });
}

// Active staff, used for the interviewer picker
export function useStaffOptions(enabled = true) {
  return useQuery({
    queryKey: ["staff-options"],
    queryFn: () => api<Paginated<StaffMember>>("/staff", { query: { limit: 100 } }),
    enabled,
  });
}

// All programs, used for the program filter
export function useProgramOptions(enabled = true) {
  return useQuery({
    queryKey: ["program-options"],
    queryFn: () => api<Paginated<Program>>("/staff/programs", { query: { limit: 100 } }),
    enabled,
  });
}