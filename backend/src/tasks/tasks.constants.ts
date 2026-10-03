import { InternshipStatus, Prisma, TaskStatus } from '@prisma/client';

export enum ReviewDecision {
  APPROVE = 'APPROVE',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
}

export const TASK_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.SUBMITTED],
  [TaskStatus.SUBMITTED]: [TaskStatus.UNDER_REVIEW],
  [TaskStatus.UNDER_REVIEW]: [TaskStatus.APPROVED, TaskStatus.CHANGES_REQUESTED],
  [TaskStatus.CHANGES_REQUESTED]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.APPROVED]: [],
};

export const CLOSED_INTERNSHIP_STATUSES: readonly InternshipStatus[] = [
  InternshipStatus.COMPLETED,
  InternshipStatus.DROPPED,
];

export const TASK_SORT_FIELDS = [
  'deadline',
  'priority',
  'status',
  'createdAt',
] as const;

export const TASK_SELECT = {
  id: true,
  internshipId: true,
  internId: true,
  createdById: true,
  title: true,
  description: true,
  deadline: true,
  priority: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaskSelect;

export const SUBMISSION_SELECT = {
  id: true,
  taskId: true,
  documentId: true,
  note: true,
  version: true,
  isLate: true,
  submittedAt: true,
  createdAt: true,
  document: {
    select: { id: true, originalName: true, mimeType: true, sizeBytes: true },
  },
} satisfies Prisma.SubmissionSelect;

export const TASK_LIST_SELECT = {
  id: true,
  internshipId: true,
  internId: true,
  createdById: true,
  title: true,
  deadline: true,
  priority: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  intern: {
    select: { id: true, internProfile: { select: { fullName: true } } },
  },
  submissions: {
    orderBy: { version: 'desc' },
    take: 1,
    select: { version: true, isLate: true, submittedAt: true },
  },
} satisfies Prisma.TaskSelect;

export const TASK_DETAIL_SELECT = {
  ...TASK_SELECT,
  internship: { select: { id: true, status: true } },
  intern: {
    select: { id: true, internProfile: { select: { fullName: true } } },
  },
  submissions: {
    orderBy: { version: 'desc' },
    take: 1,
    select: SUBMISSION_SELECT,
  },
  feedbacks: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      submissionId: true,
      comment: true,
      createdAt: true,
      staff: {
        select: { id: true, staffProfile: { select: { fullName: true } } },
      },
    },
  },
} satisfies Prisma.TaskSelect;

export type TaskRow = Prisma.TaskGetPayload<{ select: typeof TASK_SELECT }>;
export type TaskListRow = Prisma.TaskGetPayload<{
  select: typeof TASK_LIST_SELECT;
}>;
export type TaskDetailRow = Prisma.TaskGetPayload<{
  select: typeof TASK_DETAIL_SELECT;
}>;