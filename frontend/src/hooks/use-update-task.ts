"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { TaskPriority } from "@/types/tasks";

// At least one field is required by the API
export interface UpdateTaskBody {
  title?: string;
  description?: string;
  // ISO string with timezone, in the future
  deadline?: string;
  priority?: TaskPriority;
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateTaskBody) => api(`/tasks/${id}`, { method: "PATCH", body }),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["tasks"] }),
        qc.invalidateQueries({ queryKey: ["task", id] }),
        qc.invalidateQueries({ queryKey: ["task-history", id] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]),
  });
}