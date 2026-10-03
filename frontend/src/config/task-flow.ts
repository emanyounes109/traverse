import type { TaskHistoryEntry, TaskPriority, TaskStatus } from "@/types/tasks";

type Tone = "neutral" | "steel" | "accent" | "success" | "danger";

export const TASK_STATUSES: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "CHANGES_REQUESTED",
];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
};

export const TASK_STATUS_TONE: Record<TaskStatus, Tone> = {
  PENDING: "neutral",
  IN_PROGRESS: "accent",
  SUBMITTED: "steel",
  UNDER_REVIEW: "steel",
  APPROVED: "success",
  CHANGES_REQUESTED: "danger",
};

// Color of the dot in each board column header
export const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  PENDING: "bg-muted",
  IN_PROGRESS: "bg-accent",
  SUBMITTED: "bg-steel",
  UNDER_REVIEW: "bg-primary",
  APPROVED: "bg-success",
  CHANGES_REQUESTED: "bg-danger",
};

export const TASK_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_PRIORITY_TONE: Record<TaskPriority, Tone> = {
  LOW: "steel",
  MEDIUM: "accent",
  HIGH: "danger",
  URGENT: "danger",
};

const BASE_STEPS = ["Pending", "In progress", "Submitted", "Under review", "Approved"];

// Stepper for a task. "Changes requested" replaces "Under review" (in red) when work goes back.
export function taskStepper(status: TaskStatus): {
  steps: string[];
  current: number;
  tone: "accent" | "danger";
} {
  switch (status) {
    case "PENDING":
      return { steps: BASE_STEPS, current: 0, tone: "accent" };
    case "IN_PROGRESS":
      return { steps: BASE_STEPS, current: 1, tone: "accent" };
    case "SUBMITTED":
      return { steps: BASE_STEPS, current: 2, tone: "accent" };
    case "UNDER_REVIEW":
      return { steps: BASE_STEPS, current: 3, tone: "accent" };
    case "CHANGES_REQUESTED":
      return {
        steps: BASE_STEPS.map((s, i) => (i === 3 ? "Changes requested" : s)),
        current: 3,
        tone: "danger",
      };
    case "APPROVED":
    default:
      return { steps: BASE_STEPS, current: 5, tone: "accent" };
  }
}

function humanize(action: string): string {
  const text = action.toLowerCase().replace(/_/g, " ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

// One line of text for the task history timeline
export function describeTaskHistory(entry: TaskHistoryEntry): string {
  if (entry.toStatus && entry.fromStatus && entry.fromStatus !== entry.toStatus) {
    return `Moved from ${TASK_STATUS_LABEL[entry.fromStatus]} to ${TASK_STATUS_LABEL[entry.toStatus]}.`;
  }
  if (entry.toStatus && !entry.fromStatus) return "Task assigned and deadline set.";
  return humanize(entry.action);
}