import type { InternshipStatus } from "@/types/internships";

export const INTERNSHIP_STATUSES: InternshipStatus[] = [
  "ACCEPTED",
  "ONBOARDING",
  "ACTIVE",
  "COMPLETED",
  "DROPPED",
];

export const INTERNSHIP_STATUS_LABEL: Record<InternshipStatus, string> = {
  ACCEPTED: "Accepted",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active placement",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

export const INTERNSHIP_STATUS_TONE: Record<
  InternshipStatus,
  "neutral" | "steel" | "accent" | "success" | "danger"
> = {
  ACCEPTED: "neutral",
  ONBOARDING: "accent",
  ACTIVE: "success",
  COMPLETED: "steel",
  DROPPED: "danger",
};

export const INTERNSHIP_STATUS_HINT: Record<InternshipStatus, string> = {
  ACCEPTED: "The intern was accepted. Start onboarding when you are ready.",
  ONBOARDING: "Assign a mentor, then activate the placement.",
  ACTIVE: "Record a final outcome when the placement ends.",
  COMPLETED: "This placement is complete.",
  DROPPED: "This placement was dropped.",
};

export const INTERNSHIP_STEPS = ["Accepted", "Onboarding", "In progress", "Completed"];

const ORDER: InternshipStatus[] = ["ACCEPTED", "ONBOARDING", "ACTIVE"];

// Stepper position. A dropped placement is shown on the stage where it stopped.
export function internshipStep(
  status: InternshipStatus,
  history: { fromStatus: InternshipStatus | null; toStatus: InternshipStatus }[]
): { current: number; tone: "accent" | "danger" } {
  if (status === "COMPLETED") return { current: 4, tone: "accent" };

  if (status === "DROPPED") {
    const drop = [...history].reverse().find((h) => h.toStatus === "DROPPED");
    const index = drop?.fromStatus ? ORDER.indexOf(drop.fromStatus) : 0;
    return { current: Math.max(index, 0), tone: "danger" };
  }

  return { current: ORDER.indexOf(status), tone: "accent" };
}

export interface InternshipAction {
  toStatus: "ONBOARDING" | "ACTIVE" | "COMPLETED" | "DROPPED";
  label: string;
  variant: "accent" | "dangerOutline";
  // Dropping needs a written reason (1-500 characters)
  requiresReason?: boolean;
  confirmTitle: string;
  confirmText: string;
  tone: "accent" | "danger";
}

const DROP: InternshipAction = {
  toStatus: "DROPPED",
  label: "Mark as dropped",
  variant: "dangerOutline",
  requiresReason: true,
  confirmTitle: "Mark this placement as dropped?",
  confirmText: "This is final and cannot be undone. Please explain why.",
  tone: "danger",
};

// Allowed moves: ACCEPTED -> ONBOARDING -> ACTIVE -> COMPLETED, and any open stage -> DROPPED
export const INTERNSHIP_ACTIONS: Partial<Record<InternshipStatus, InternshipAction[]>> = {
  ACCEPTED: [
    {
      toStatus: "ONBOARDING",
      label: "Start onboarding",
      variant: "accent",
      confirmTitle: "Start onboarding?",
      confirmText: "The intern will be notified that onboarding has started.",
      tone: "accent",
    },
    DROP,
  ],
  ONBOARDING: [
    {
      toStatus: "ACTIVE",
      label: "Activate placement",
      variant: "accent",
      confirmTitle: "Activate this placement?",
      confirmText: "A mentor must be assigned first. Tasks can be created once it is active.",
      tone: "accent",
    },
    DROP,
  ],
  ACTIVE: [
    {
      toStatus: "COMPLETED",
      label: "Mark as completed",
      variant: "accent",
      confirmTitle: "Mark as completed?",
      confirmText:
        "The placement will be closed. Tasks that are not approved yet will stay incomplete.",
      tone: "accent",
    },
    DROP,
  ],
};