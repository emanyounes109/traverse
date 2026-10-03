import type {
  DashApplicationStatus,
  DashInterviewStatus,
  DashInternshipStatus,
  DashTaskPriority,
  DashTaskStatus,
} from "@/types/dashboard";

export type Tone = "neutral" | "steel" | "accent" | "success" | "danger";

export const DASH_TASK_STATUSES: DashTaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "CHANGES_REQUESTED",
];

export const DASH_TASK_LABEL: Record<DashTaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
};

export const DASH_TASK_NUMBER_TONE: Record<DashTaskStatus, string> = {
  PENDING: "text-ink",
  IN_PROGRESS: "text-accent",
  SUBMITTED: "text-ink",
  UNDER_REVIEW: "text-steel",
  APPROVED: "text-success",
  CHANGES_REQUESTED: "text-danger",
};

export const DASH_PRIORITY_LABEL: Record<DashTaskPriority, string> = {
  LOW: "Low priority",
  MEDIUM: "Medium priority",
  HIGH: "High priority",
  URGENT: "Urgent",
};

export const DASH_INTERNSHIP_STEPS = [
  "Application",
  "Interview",
  "Offer accepted",
  "Onboarding",
  "In progress",
  "Completed",
];

// Current step of the stepper for each internship status
export function internshipStepIndex(status: DashInternshipStatus): number {
  switch (status) {
    case "ACCEPTED":
      return 2;
    case "ONBOARDING":
      return 3;
    case "ACTIVE":
      return 4;
    case "COMPLETED":
      return 5;
    default:
      return 4;
  }
}

export const DASH_INTERNSHIP_STATUS_LABEL: Record<DashInternshipStatus, string> = {
  ACCEPTED: "Accepted",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active placement",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

export const DASH_INTERNSHIP_STATUS_TONE: Record<DashInternshipStatus, Tone> = {
  ACCEPTED: "neutral",
  ONBOARDING: "accent",
  ACTIVE: "success",
  COMPLETED: "steel",
  DROPPED: "danger",
};

export const DASH_APPLICATION_STATUSES: DashApplicationStatus[] = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
];

export const DASH_APPLICATION_LABEL: Record<DashApplicationStatus, string> = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const DASH_APPLICATION_BAR: Record<DashApplicationStatus, string> = {
  APPLIED: "bg-brand",
  UNDER_REVIEW: "bg-steel",
  SHORTLISTED: "bg-primary",
  INTERVIEW: "bg-accent",
  ACCEPTED: "bg-success",
  REJECTED: "bg-danger",
};

export const DASH_INTERVIEW_STATUS_LABEL: Record<DashInterviewStatus, string> = {
  SCHEDULED: "Scheduled",
  RESCHEDULED: "Rescheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const DASH_INTERVIEW_STATUS_TONE: Record<DashInterviewStatus, Tone> = {
  SCHEDULED: "steel",
  RESCHEDULED: "accent",
  COMPLETED: "success",
  CANCELLED: "danger",
};