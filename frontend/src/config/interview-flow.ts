import type { InterviewResult, InterviewStatus } from "@/types/applications";

export const INTERVIEW_STATUSES: InterviewStatus[] = [
  "SCHEDULED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
];

export const INTERVIEW_STATUS_LABEL: Record<InterviewStatus, string> = {
  SCHEDULED: "Scheduled",
  RESCHEDULED: "Rescheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const INTERVIEW_STATUS_TONE: Record<
  InterviewStatus,
  "neutral" | "steel" | "accent" | "success" | "danger"
> = {
  SCHEDULED: "accent",
  RESCHEDULED: "accent",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export const INTERVIEW_RESULT_LABEL: Record<InterviewResult, string> = {
  PASSED: "Passed",
  FAILED: "Failed",
  NEEDS_ANOTHER_ROUND: "Needs another round",
};

// Only active interviews can be rescheduled, completed or cancelled
export function isActiveInterview(status: InterviewStatus): boolean {
  return status === "SCHEDULED" || status === "RESCHEDULED";
}