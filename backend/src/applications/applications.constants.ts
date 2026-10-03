import { ApplicationStatus, Prisma } from '@prisma/client';

export const APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  [ApplicationStatus.APPLIED]: [ApplicationStatus.UNDER_REVIEW],
  [ApplicationStatus.UNDER_REVIEW]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [ApplicationStatus.INTERVIEW],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.ACCEPTED]: [],
  [ApplicationStatus.REJECTED]: [],
};

export const PATCHABLE_STATUSES = [
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.ACCEPTED,
] as const;

export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const DATE_OR_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2}))?$/;

export const APPLICATION_CORE_SELECT = {
  id: true,
  internId: true,
  programId: true,
  status: true,
  appliedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ApplicationSelect;

export const APPLICATION_SELECT = {
  ...APPLICATION_CORE_SELECT,
  program: { select: { id: true, name: true, status: true } },
} satisfies Prisma.ApplicationSelect;