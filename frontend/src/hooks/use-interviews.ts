"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/types/api";
import type {
  ApplicationListItem,
  InterviewResult,
  InterviewStatus,
} from "@/types/applications";
import type { InterviewListItem } from "@/types/interviews";

export interface InterviewsParams {
  page: number;
  limit: number;
  // YYYY-MM-DD
  from?: string;
  to?: string;
  status?: InterviewStatus | "";
  sortBy?: "scheduledAt" | "createdAt";
  order?: "asc" | "desc";
}

export function useInterviews(params: InterviewsParams, enabled = true) {
  return useQuery({
    queryKey: ["interviews", params],
    queryFn: () => api<Paginated<InterviewListItem>>("/interviews", { query: { ...params } }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export type InterviewActionBody =
  | { action: "RESCHEDULE"; scheduledAt: string; interviewerId?: string }
  | { action: "CANCEL"; reason: string }
  | { action: "COMPLETE"; result: InterviewResult; notes?: string };

function useRefreshInterviews() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["interviews"] }),
      qc.invalidateQueries({ queryKey: ["applications"] }),
      qc.invalidateQueries({ queryKey: ["application"] }),
      qc.invalidateQueries({ queryKey: ["schedulable-applications"] }),
    ]);
}

// Reschedule, cancel or complete one interview
export function useInterviewAction(interviewId: string) {
  const refresh = useRefreshInterviews();
  return useMutation({
    mutationFn: (body: InterviewActionBody) =>
      api(`/interviews/${interviewId}`, { method: "PATCH", body }),
    onSuccess: refresh,
  });
}

// Schedule an interview for any application (the application id is chosen at submit time)
export function useCreateInterview() {
  const refresh = useRefreshInterviews();
  return useMutation({
    mutationFn: ({
      applicationId,
      interviewerId,
      scheduledAt,
    }: {
      applicationId: string;
      interviewerId: string;
      scheduledAt: string;
    }) =>
      api(`/applications/${applicationId}/interviews`, {
        method: "POST",
        body: { interviewerId, scheduledAt },
      }),
    onSuccess: refresh,
  });
}

// Applications that can get an interview: Shortlisted or already in the Interview stage
export function useSchedulableApplications(enabled = true) {
  return useQuery({
    queryKey: ["schedulable-applications"],
    queryFn: async () => {
      const [shortlisted, interview] = await Promise.all([
        api<Paginated<ApplicationListItem>>("/applications", {
          query: { status: "SHORTLISTED", limit: 100 },
        }),
        api<Paginated<ApplicationListItem>>("/applications", {
          query: { status: "INTERVIEW", limit: 100 },
        }),
      ]);
      return [...shortlisted.data, ...interview.data];
    },
    enabled,
  });
}