"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format-datetime";
import type { Paginated } from "@/types/api";
import type { ApplicationListItem } from "@/types/applications";
import type { AuditEntityType, AuditResponse } from "@/types/audit";
import type { InternListItem } from "@/types/interns";
import type { InterviewListItem } from "@/types/interviews";
import type { TaskListItem } from "@/types/tasks";

export interface AuditRecordOption {
  id: string;
  label: string;
}

// History of one record. For "mentor-assignments" the id is the INTERNSHIP id.
export function useAuditEntries(type: AuditEntityType | "", id: string, enabled = true) {
  return useQuery({
    queryKey: ["audit", type, id],
    queryFn: () => api<AuditResponse>(`/audit/${type}/${id}`),
    enabled: enabled && !!type && !!id,
  });
}

// Records the caller can pick from (the list endpoints are already limited to what they may see)
export function useAuditRecords(type: AuditEntityType | "", enabled = true) {
  return useQuery({
    queryKey: ["audit-records", type],
    queryFn: async (): Promise<AuditRecordOption[]> => {
      switch (type) {
        case "application": {
          const res = await api<Paginated<ApplicationListItem>>("/applications", {
            query: { limit: 100 },
          });
          return res.data.map((a) => ({
            id: a.id,
            label: `${a.applicant.fullName} · ${a.program.name}`,
          }));
        }
        case "interview": {
          const res = await api<Paginated<InterviewListItem>>("/interviews", {
            query: { limit: 100, sortBy: "scheduledAt", order: "desc" },
          });
          return res.data.map((i) => ({
            id: i.id,
            label: `${i.applicant.fullName} · ${formatDateTime(i.scheduledAt)}`,
          }));
        }
        case "internship":
        case "mentor-assignments": {
          // Both use the internship id
          const res = await api<Paginated<InternListItem>>("/interns", { query: { limit: 100 } });
          return res.data.map((i) => ({
            id: i.internshipId,
            label: `${i.fullName} · ${i.program.name}`,
          }));
        }
        case "task": {
          const res = await api<Paginated<TaskListItem>>("/tasks", {
            query: { limit: 100, sortBy: "createdAt", order: "desc" },
          });
          return res.data.map((t) => ({
            id: t.id,
            label: `${t.title} · ${t.intern.fullName}`,
          }));
        }
        default:
          return [];
      }
    },
    enabled: enabled && !!type,
  });
}