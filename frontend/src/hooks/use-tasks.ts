"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/types/api";
import type { InternListItem } from "@/types/interns";
import type {
  TaskDetail,
  TaskHistoryEntry,
  TaskListItem,
  TaskPriority,
  TaskSubmission,
} from "@/types/tasks";

// Board data: up to 100 tasks, grouped into columns on the client
export function useTasksBoard(role: "INTERN" | "STAFF", search: string, enabled = true) {
  return useQuery({
    queryKey: ["tasks", role, search],
    queryFn: () =>
      api<Paginated<TaskListItem>>(role === "INTERN" ? "/tasks/me" : "/tasks", {
        query: { search, limit: 100, sortBy: "deadline", order: "asc" },
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => api<TaskDetail>(`/tasks/${id}`),
    enabled: !!id,
  });
}

// Newest first
export function useTaskSubmissions(id: string) {
  return useQuery({
    queryKey: ["task-submissions", id],
    queryFn: () => api<TaskSubmission[]>(`/tasks/${id}/submissions`),
    enabled: !!id,
  });
}

// Oldest first
export function useTaskHistory(id: string) {
  return useQuery({
    queryKey: ["task-history", id],
    queryFn: () => api<TaskHistoryEntry[]>(`/tasks/${id}/history`),
    enabled: !!id,
  });
}

function useRefreshTask(id: string) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["tasks"] }),
      qc.invalidateQueries({ queryKey: ["task", id] }),
      qc.invalidateQueries({ queryKey: ["task-submissions", id] }),
      qc.invalidateQueries({ queryKey: ["task-history", id] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}

// Intern: PENDING or CHANGES_REQUESTED -> IN_PROGRESS
export function useStartTask(id: string) {
  const refresh = useRefreshTask(id);
  return useMutation({
    mutationFn: () => api(`/tasks/${id}/start`, { method: "POST" }),
    onSuccess: refresh,
  });
}

// Intern: uploads a file (required) and an optional note
export function useSubmitTask(id: string) {
  const refresh = useRefreshTask(id);
  return useMutation({
    mutationFn: ({ file, note }: { file: File; note?: string }) => {
      const form = new FormData();
      // Text fields go before the file so the server can read them first
      if (note) form.append("note", note);
      form.append("file", file);
      return api<TaskSubmission>(`/tasks/${id}/submit`, { method: "POST", formData: form });
    },
    onSuccess: refresh,
  });
}

// Staff: SUBMITTED -> UNDER_REVIEW
export function useStartReview(id: string) {
  const refresh = useRefreshTask(id);
  return useMutation({
    mutationFn: () => api(`/tasks/${id}/start-review`, { method: "POST" }),
    onSuccess: refresh,
  });
}

export function useReviewTask(id: string) {
  const refresh = useRefreshTask(id);
  return useMutation({
    mutationFn: (body: { decision: "APPROVE" | "REQUEST_CHANGES"; feedback?: string }) =>
      api(`/tasks/${id}/review`, { method: "PATCH", body }),
    onSuccess: refresh,
  });
}

export interface CreateTaskBody {
  internshipId: string;
  title: string;
  description: string;
  // ISO string with timezone, in the future
  deadline: string;
  priority: TaskPriority;
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTaskBody) => api<{ id: string }>("/tasks", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

// Interns with an ACTIVE internship: tasks can only be created for those
export function useActiveInterns(enabled = true) {
  return useQuery({
    queryKey: ["active-interns"],
    queryFn: () => api<Paginated<InternListItem>>("/interns", { query: { status: "ACTIVE", limit: 100 } }),
    enabled,
  });
}