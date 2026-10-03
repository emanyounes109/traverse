"use client";

import {
  Bell,
  Briefcase,
  CalendarDays,
  CalendarX2,
  Check,
  Clock,
  Layers,
  ListChecks,
  MessageSquare,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDateTime } from "@/lib/format-datetime";
import { notificationText } from "@/lib/notification-text";
import type { AppNotification, NotificationType } from "@/types/notifications";

const ICONS: Record<NotificationType, LucideIcon> = {
  APPLICATION_SUBMITTED: Briefcase,
  APPLICATION_STATUS_CHANGED: Briefcase,
  INTERVIEW_SCHEDULED: CalendarDays,
  INTERVIEW_RESCHEDULED: CalendarDays,
  INTERVIEW_CANCELLED: CalendarX2,
  TASK_ASSIGNED: ListChecks,
  TASK_DEADLINE_APPROACHING: Clock,
  SUBMISSION_REVIEWED: Check,
  FEEDBACK_RECEIVED: MessageSquare,
  MENTOR_ASSIGNED: Users,
  INTERNSHIP_STATUS_CHANGED: Layers,
};

type Props = {
  notification: AppNotification;
  onSelect: (notification: AppNotification) => void;
};

export function NotificationItem({ notification, onSelect }: Props) {
  const Icon = ICONS[notification.type] ?? Bell;
  const { title, detail } = notificationText(notification);
  const unread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className="flex w-full items-start gap-3 border-b border-line px-5 py-3.5 text-left transition last:border-b-0 hover:bg-canvas"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-ink">
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm leading-snug ${
            unread ? "font-semibold text-ink" : "font-medium text-muted"
          }`}
        >
          {title}
        </span>
        {detail && <span className="mt-0.5 block truncate text-xs text-muted">{detail}</span>}
        <span className="mt-1 block font-mono text-[11px] text-muted">
          {formatDateTime(notification.createdAt)}
        </span>
      </span>

      {unread && <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
    </button>
  );
}