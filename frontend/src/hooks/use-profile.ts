"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { InternshipSummary } from "@/types/internships";

// The intern's latest internship, or null when they do not have one yet
export function useMyInternship(enabled = true) {
  return useQuery({
    queryKey: ["my-internship"],
    queryFn: async () => {
      try {
        return await api<InternshipSummary>("/internships/me");
      } catch (e) {
        if (e instanceof ApiError && e.statusCode === 404) return null;
        throw e;
      }
    },
    enabled,
  });
}

// Intern: fullName, phone (null clears), contactInfo (null clears)
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api("/profile/me", { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}