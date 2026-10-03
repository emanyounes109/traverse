import type {
  ApplicationStatus,
  InternshipStatus,
  InterviewResult,
  InterviewStatus,
  TaskStatus,
} from '@prisma/client';

export const AppEvents = {
  APPLICATION_SUBMITTED: 'application.submitted',
  APPLICATION_STATUS_CHANGED: 'application.statusChanged',
  INTERVIEW_SCHEDULED: 'interview.scheduled',
  INTERVIEW_RESCHEDULED: 'interview.rescheduled',
  INTERVIEW_CANCELLED: 'interview.cancelled',
  INTERVIEW_COMPLETED: 'interview.completed',
  TASK_ASSIGNED: 'task.assigned',
  TASK_DEADLINE_APPROACHING: 'task.deadlineApproaching',
  TASK_REVIEWED: 'task.reviewed',
  TASK_FEEDBACK_GIVEN: 'task.feedbackGiven',
  MENTOR_ASSIGNED: 'mentor.assigned',
  INTERNSHIP_STATUS_CHANGED: 'internship.statusChanged',
} as const;

export type AppEventName = (typeof AppEvents)[keyof typeof AppEvents];

export interface ApplicationSubmittedEvent {
  applicationId: string;
  internId: string;
  programId: string;
  recipientUserIds: string[];
}

export interface ApplicationStatusChangedEvent {
  applicationId: string;
  internId: string;
  programId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
}

export interface InterviewEvent {
  interviewId: string;
  applicationId: string;
  internId: string;
  programId: string;
  interviewerId: string;
  scheduledAt: Date;
  status: InterviewStatus;
  result?: InterviewResult;
  occurredAt: Date;
}

export interface InterviewRescheduledEvent extends InterviewEvent {
  oldScheduledAt: Date;
}

export interface MentorAssignedEvent {
  internshipId: string;
  internId: string;
  programId: string;
  mentorId: string;
  previousMentorId?: string;
  occurredAt: Date;
}

export interface InternshipStatusChangedEvent {
  internshipId: string;
  internId: string;
  programId: string;
  fromStatus: InternshipStatus;
  toStatus: InternshipStatus;
  occurredAt: Date;
}

export interface TaskAssignedEvent {
  taskId: string;
  internshipId: string;
  internId: string;
  title: string;
  deadline: Date;
  occurredAt: Date;
}

export interface TaskDeadlineApproachingEvent {
  taskId: string;
  internshipId: string;
  internId: string;
  title: string;
  deadline: Date;
  occurredAt: Date;
}

export interface TaskReviewedEvent {
  taskId: string;
  internId: string;
  internshipId: string;
  decision: 'APPROVE' | 'REQUEST_CHANGES';
  status: TaskStatus;
  occurredAt: Date;
}

export interface TaskFeedbackGivenEvent {
  taskId: string;
  internId: string;
  feedbackId: string;
  occurredAt: Date;
}