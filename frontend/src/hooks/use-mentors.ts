"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/types/api";
import type {
  AssignMentorResult,
  MentorHistoryEntry,
  MentorWorkloadItem,
  MentorableIntern,
} from "@/types/mentors";

// Active staff with their current mentoring load
export function useMentorWorkload(enabled = true) {
  return useQuery({
    queryKey: ["staff-workload"],
    queryFn: () => api<MentorWorkloadItem[]>("/staff/workload"),
    enabled,
  });
}

// Interns in the caller's scope (filtered to open internships by the page)
export function useMentorableInterns(enabled = true) {
  return useQuery({
    queryKey: ["interns", "mentorable"],
    queryFn: () =>
      api<Paginated<MentorableIntern>>("/interns", {
        query: { limit: 100, sortBy: "fullName", order: "asc" },
      }),
    enabled,
  });
}

export function useMentorHistory(internId: string | undefined) {
  return useQuery({
    queryKey: ["mentor-history", internId],
    queryFn: () => api<MentorHistoryEntry[]>(`/interns/${internId}/mentor-history`),
    enabled: !!internId,
  });
}

const AFFECTED_KEYS = [
  "staff-workload",
  "interns",
  "intern",
  "mentor-history",
  "internship-history",
  "my-internship",
  "dashboard",
];

export function useAssignMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ internshipId, staffId }: { internshipId: string; staffId: string }) =>
      api<AssignMentorResult>(`/internships/${internshipId}/mentor`, {
        method: "POST",
        body: { staffId },
      }),
    onSuccess: () =>
      Promise.all(AFFECTED_KEYS.map((key) => qc.invalidateQueries({ queryKey: [key] }))),
  });
}