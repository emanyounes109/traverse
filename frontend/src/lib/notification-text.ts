import { formatDateTime } from "@/lib/format-datetime";
import type { AppNotification } from "@/types/notifications";

const APPLICATION_TEXT: Record<string, string> = {
  UNDER_REVIEW: "Your application is under review",
  SHORTLISTED: "You were shortlisted",
  INTERVIEW: "You moved to the interview stage",
  ACCEPTED: "Your application was accepted",
  REJECTED: "Your application was rejected",
};

const INTERNSHIP_TEXT: Record<string, string> = {
  ACCEPTED: "Your internship was created",
  ONBOARDING: "Your onboarding has started",
  ACTIVE: "Your internship is now active",
  COMPLETED: "Your internship was completed",
  DROPPED: "Your internship was ended",
};

function text(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function join(...parts: (string | null)[]): string | null {
  const present = parts.filter((part): part is string => !!part);
  return present.length > 0 ? present.join(" · ") : null;
}

function dateText(value: string | null): string | null {
  return value ? formatDateTime(value) : null;
}

function dueText(value: string | null): string | null {
  return value ? `Due ${formatDateTime(value)}` : null;
}

export function notificationText(n: AppNotification): { title: string; detail: string | null } {
  const p = n.payload ?? {};
  const program = text(p, "programName");
  const task = text(p, "taskTitle");

  switch (n.type) {
    case "APPLICATION_SUBMITTED":
      return { title: "New application received", detail: program };

    case "APPLICATION_STATUS_CHANGED": {
      const to = text(p, "toStatus");
      return { title: (to && APPLICATION_TEXT[to]) || "Your application was updated", detail: program };
    }

    case "INTERVIEW_SCHEDULED":
      return {
        title: "Your interview was scheduled",
        detail: join(dateText(text(p, "scheduledAt")), program),
      };

    case "INTERVIEW_RESCHEDULED":
      return {
        title: "Your interview was rescheduled",
        detail: join(dateText(text(p, "scheduledAt")), program),
      };

    case "INTERVIEW_CANCELLED":
      return { title: "Your interview was cancelled", detail: program };

    case "TASK_ASSIGNED":
      return {
        title: "A new task was assigned to you",
        detail: join(task, dueText(text(p, "deadline"))),
      };

    case "TASK_DEADLINE_APPROACHING":
      return {
        title: "A task deadline is coming up",
        detail: join(task, dueText(text(p, "deadline"))),
      };

    case "SUBMISSION_REVIEWED": {
      const decision = text(p, "decision");
      const title =
        decision === "APPROVE"
          ? "Your submission was approved"
          : decision === "REQUEST_CHANGES"
            ? "Changes were requested on your submission"
            : "Your submission was reviewed";
      return { title, detail: task };
    }

    case "FEEDBACK_RECEIVED":
      return { title: "You received new feedback", detail: task };

    case "MENTOR_ASSIGNED": {
      const mentor = text(p, "mentorName");
      return {
        title: mentor ? `${mentor} is now your mentor` : "A mentor was assigned to you",
        detail: program,
      };
    }

    case "INTERNSHIP_STATUS_CHANGED": {
      const to = text(p, "toStatus");
      return { title: (to && INTERNSHIP_TEXT[to]) || "Your internship was updated", detail: program };
    }

    default:
      return { title: "You have a new update", detail: null };
  }
}

// Where a click on the notification should go (null = stay on the page)
export function notificationHref(n: AppNotification): string | null {
  const p = n.payload ?? {};
  const applicationId = text(p, "applicationId");
  const taskId = text(p, "taskId");

  switch (n.type) {
    case "APPLICATION_SUBMITTED":
      return applicationId ? `/staff/applications/${applicationId}` : "/staff/applications";

    case "APPLICATION_STATUS_CHANGED":
    case "INTERVIEW_SCHEDULED":
    case "INTERVIEW_RESCHEDULED":
    case "INTERVIEW_CANCELLED":
      return applicationId ? `/intern/applications/${applicationId}` : "/intern/applications";

    case "TASK_ASSIGNED":
    case "TASK_DEADLINE_APPROACHING":
    case "SUBMISSION_REVIEWED":
    case "FEEDBACK_RECEIVED":
      return taskId ? `/intern/tasks/${taskId}` : "/intern/tasks";

    case "MENTOR_ASSIGNED":
    case "INTERNSHIP_STATUS_CHANGED":
      return "/intern/dashboard";

    default:
      return null;
  }
}