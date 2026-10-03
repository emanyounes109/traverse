import type { Paginated } from "./api";

export type NotificationType =
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_STATUS_CHANGED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_RESCHEDULED"
  | "INTERVIEW_CANCELLED"
  | "TASK_ASSIGNED"
  | "TASK_DEADLINE_APPROACHING"
  | "SUBMISSION_REVIEWED"
  | "FEEDBACK_RECEIVED"
  | "MENTOR_ASSIGNED"
  | "INTERNSHIP_STATUS_CHANGED";

export type NotificationPayload = Record<string, unknown>;

export interface AppNotification {
  id: string;
  type: NotificationType;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
}

// GET /notifications (unreadCount counts ALL unread, regardless of page or filter)
export interface NotificationsResponse extends Paginated<AppNotification> {
  unreadCount: number;
}