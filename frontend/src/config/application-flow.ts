import type { ApplicationStatus } from "@/types/applications";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
];

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const APPLICATION_STATUS_TONE: Record<
  ApplicationStatus,
  "neutral" | "steel" | "accent" | "success" | "danger"
> = {
  APPLIED: "neutral",
  UNDER_REVIEW: "neutral",
  SHORTLISTED: "steel",
  INTERVIEW: "accent",
  ACCEPTED: "success",
  REJECTED: "danger",
};

/* ---------- Intern view: journey for one program ---------- */

export const OPPORTUNITY_STEPS = ["Explore", "Apply", "Interview", "Placement"];

// Where the intern is in the journey for a given program
export function opportunityStep(status?: ApplicationStatus): {
  current: number;
  tone: "accent" | "danger";
} {
  // Not applied yet: the next move is to apply
  if (!status) return { current: 1, tone: "accent" };

  if (status === "ACCEPTED") return { current: 3, tone: "accent" };
  if (status === "REJECTED") return { current: 2, tone: "danger" };

  // Applied, under review, shortlisted or interview: waiting on the interview stage
  return { current: 2, tone: "accent" };
}

/* ---------- Staff view: application journey ---------- */

export const APPLICATION_STEPS = ["Applied", "In review", "Shortlisted", "Interview", "Accepted"];

const STEP_ORDER: ApplicationStatus[] = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "ACCEPTED",
];

// Stepper position. A rejection is shown on the stage where it happened.
export function applicationStep(
  status: ApplicationStatus,
  history: { fromStatus: ApplicationStatus | null; toStatus: ApplicationStatus }[]
): { current: number; tone: "accent" | "danger" } {
  if (status === "REJECTED") {
    const rejection = [...history].reverse().find((h) => h.toStatus === "REJECTED");
    const index = rejection?.fromStatus ? STEP_ORDER.indexOf(rejection.fromStatus) : 1;
    return { current: Math.max(index, 0), tone: "danger" };
  }

  return { current: STEP_ORDER.indexOf(status), tone: "accent" };
}

/* ---------- Staff view: next step actions ---------- */

export interface StatusAction {
  toStatus: "UNDER_REVIEW" | "SHORTLISTED" | "REJECTED" | "ACCEPTED";
  label: string;
  variant: "accent" | "dangerOutline";
  confirmTitle: string;
  confirmText: string;
  tone: "accent" | "danger";
}

const REJECT: StatusAction = {
  toStatus: "REJECTED",
  label: "Reject applicant",
  variant: "dangerOutline",
  confirmTitle: "Reject this applicant?",
  confirmText: "The applicant will be notified. This decision is final and cannot be undone.",
  tone: "danger",
};

export const APPLICATION_NEXT_STEP: Partial<
  Record<ApplicationStatus, { text: string; actions: StatusAction[] }>
> = {
  APPLIED: {
    text: "Start reviewing this application to move it forward.",
    actions: [
      {
        toStatus: "UNDER_REVIEW",
        label: "Start review",
        variant: "accent",
        confirmTitle: "Start reviewing?",
        confirmText: "The applicant will be notified that their application is under review.",
        tone: "accent",
      },
    ],
  },
  UNDER_REVIEW: {
    text: "Decide whether to shortlist this applicant or reject the application.",
    actions: [
      {
        toStatus: "SHORTLISTED",
        label: "Shortlist applicant",
        variant: "accent",
        confirmTitle: "Shortlist this applicant?",
        confirmText: "The applicant will be notified and can then be scheduled for an interview.",
        tone: "accent",
      },
      REJECT,
    ],
  },
  SHORTLISTED: {
    text: "Schedule an interview to move this applicant to the interview stage.",
    actions: [],
  },
  INTERVIEW: {
    text: "Record the interview decision and send the outcome. Accepting requires the latest interview to be completed with a Passed result.",
    actions: [
      {
        toStatus: "ACCEPTED",
        label: "Accept applicant",
        variant: "accent",
        confirmTitle: "Accept this applicant?",
        confirmText:
          "An internship will be created for the applicant and one program place will be used. This cannot be undone.",
        tone: "accent",
      },
      REJECT,
    ],
  },
};