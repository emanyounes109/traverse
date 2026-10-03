import type { InternshipStatus } from "./internships";

export type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskSubmission {
  id: string;
  taskId: string;
  documentId: string;
  note: string | null;
  version: number;
  isLate: boolean;
  submittedAt: string;
  createdAt: string;
  document?: { id: string; originalName: string; mimeType: string; sizeBytes: number };
}

// Item returned by GET /tasks and GET /tasks/me
export interface TaskListItem {
  id: string;
  internshipId: string;
  internId: string;
  createdById: string;
  title: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  // Derived by the server: deadline passed and not approved
  isOverdue: boolean;
  intern: { id: string; fullName: string };
  latestSubmission: { version: number; isLate: boolean; submittedAt: string } | null;
}

export interface TaskFeedback {
  id: string;
  submissionId: string;
  comment: string;
  createdAt: string;
  staff: { id: string; fullName: string };
}

// GET /tasks/:id
export interface TaskDetail extends Omit<TaskListItem, "latestSubmission"> {
  description: string;
  internship: { id: string; status: InternshipStatus };
  latestSubmission: TaskSubmission | null;
  // Oldest first
  feedback: TaskFeedback[];
}

export interface TaskHistoryEntry {
  id: string;
  action: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  note: string | null;
  createdAt: string;
  changedBy: { id: string; fullName: string };
}