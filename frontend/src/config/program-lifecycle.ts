import type { ProgramAction, ProgramStatus } from "@/types/api";

type StatusTone = "steel" | "accent" | "success" | "danger" | "neutral";

export const PROGRAM_STATUSES: ProgramStatus[] = [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
];

export const PROGRAM_STATUS_META: Record<
  ProgramStatus,
  { label: string; tone: StatusTone; hint: string }
> = {
  DRAFT: {
    label: "Draft",
    tone: "neutral",
    hint: "Not visible to interns yet. Publish the program to open applications.",
  },
  OPEN: {
    label: "Open for applications",
    tone: "success",
    hint: "Interns can apply now. Close applications when you are ready to review and interview.",
  },
  CLOSED: {
    label: "Applications closed",
    tone: "accent",
    hint: "Review candidates and run interviews, then start the placement.",
  },
  IN_PROGRESS: {
    label: "In progress",
    tone: "accent",
    hint: "The placement is underway. Mark it as completed when everyone has finished.",
  },
  COMPLETED: {
    label: "Completed",
    tone: "steel",
    hint: "The placement is complete. You can archive the program.",
  },
  ARCHIVED: {
    label: "Archived",
    tone: "neutral",
    hint: "This program is archived and read-only.",
  },
};

export const LIFECYCLE_STEPS = ["Planning", "Applications", "Interviews", "Placement", "Completed"];

// Index of the current step in the stepper (5 = everything is done)
export const STATUS_STEP: Record<ProgramStatus, number> = {
  DRAFT: 0,
  OPEN: 1,
  CLOSED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 5,
  ARCHIVED: 5,
};

export interface LifecycleAction {
  action: ProgramAction;
  label: string;
  confirmTitle: string;
  confirmText: string;
  tone: "accent" | "danger";
}

// The main forward move for each status
export const PRIMARY_ACTION: Partial<Record<ProgramStatus, LifecycleAction>> = {
  DRAFT: {
    action: "publish",
    label: "Publish program",
    confirmTitle: "Publish this program?",
    confirmText:
      "Interns will be able to see it and apply. Most fields get locked after publishing.",
    tone: "accent",
  },
  OPEN: {
    action: "close",
    label: "Close applications",
    confirmTitle: "Close applications?",
    confirmText: "Interns will no longer be able to apply. This cannot be undone.",
    tone: "accent",
  },
  CLOSED: {
    action: "start",
    label: "Start placement",
    confirmTitle: "Start the placement?",
    confirmText: "The program moves to In progress. This cannot be undone.",
    tone: "accent",
  },
  IN_PROGRESS: {
    action: "complete",
    label: "Mark as completed",
    confirmTitle: "Mark as completed?",
    confirmText: "The program moves to Completed. This cannot be undone.",
    tone: "accent",
  },
  COMPLETED: {
    action: "archive",
    label: "Archive program",
    confirmTitle: "Archive this program?",
    confirmText: "An archived program becomes read-only. This cannot be undone.",
    tone: "danger",
  },
};

// Optional secondary move (archive is allowed from Draft and Closed as well)
export const SECONDARY_ACTION: Partial<Record<ProgramStatus, LifecycleAction>> = {
  DRAFT: {
    action: "archive",
    label: "Archive",
    confirmTitle: "Archive this program?",
    confirmText: "An archived program becomes read-only. This cannot be undone.",
    tone: "danger",
  },
  CLOSED: {
    action: "archive",
    label: "Archive",
    confirmTitle: "Archive this program?",
    confirmText: "An archived program becomes read-only. This cannot be undone.",
    tone: "danger",
  },
};