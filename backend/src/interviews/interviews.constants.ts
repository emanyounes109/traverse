import { ApplicationStatus, InterviewStatus, Prisma } from '@prisma/client';

export enum InterviewAction {
  RESCHEDULE = 'RESCHEDULE',
  CANCEL = 'CANCEL',
  COMPLETE = 'COMPLETE',
}

export const INTERVIEW_TRANSITIONS: Record<
  InterviewStatus,
  readonly InterviewStatus[]
> = {
  [InterviewStatus.SCHEDULED]: [
    InterviewStatus.COMPLETED,
    InterviewStatus.CANCELLED,
    InterviewStatus.RESCHEDULED,
  ],
  [InterviewStatus.RESCHEDULED]: [
    InterviewStatus.COMPLETED,
    InterviewStatus.CANCELLED,
    InterviewStatus.RESCHEDULED,
  ],
  [InterviewStatus.COMPLETED]: [],
  [InterviewStatus.CANCELLED]: [],
};

export const ACTIVE_INTERVIEW_STATUSES: readonly InterviewStatus[] = [
  InterviewStatus.SCHEDULED,
  InterviewStatus.RESCHEDULED,
];

export const ELIGIBLE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
];

export const ACTION_TARGET_STATUS: Record<InterviewAction, InterviewStatus> = {
  [InterviewAction.RESCHEDULE]: InterviewStatus.RESCHEDULED,
  [InterviewAction.CANCEL]: InterviewStatus.CANCELLED,
  [InterviewAction.COMPLETE]: InterviewStatus.COMPLETED,
};

export const INTERVIEW_SELECT = {
  id: true,
  applicationId: true,
  interviewerId: true,
  scheduledAt: true,
  status: true,
  result: true,
  notes: true,
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InterviewSelect;

export const INTERVIEW_HISTORY_SELECT = {
  id: true,
  action: true,
  oldScheduledAt: true,
  newScheduledAt: true,
  oldInterviewerId: true,
  newInterviewerId: true,
  oldStatus: true,
  newStatus: true,
  note: true,
  changedById: true,
  createdAt: true,
} satisfies Prisma.InterviewHistorySelect;