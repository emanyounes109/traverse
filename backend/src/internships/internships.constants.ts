import { ConfigService } from '@nestjs/config';
import { InternshipStatus, Prisma } from '@prisma/client';

export const INTERNSHIP_TRANSITIONS: Record<
  InternshipStatus,
  readonly InternshipStatus[]
> = {
  [InternshipStatus.ACCEPTED]: [
    InternshipStatus.ONBOARDING,
    InternshipStatus.DROPPED,
  ],
  [InternshipStatus.ONBOARDING]: [
    InternshipStatus.ACTIVE,
    InternshipStatus.DROPPED,
  ],
  [InternshipStatus.ACTIVE]: [
    InternshipStatus.COMPLETED,
    InternshipStatus.DROPPED,
  ],
  [InternshipStatus.COMPLETED]: [],
  [InternshipStatus.DROPPED]: [],
};

export const OPEN_INTERNSHIP_STATUSES: readonly InternshipStatus[] = [
  InternshipStatus.ACCEPTED,
  InternshipStatus.ONBOARDING,
  InternshipStatus.ACTIVE,
];

export const INTERN_SORT_FIELDS = [
  'fullName',
  'progress',
  'status',
  'startedAt',
  'createdAt',
] as const;

export function maxInternsPerMentor(config: ConfigService): number {
  const value = Number(config.get<string>('MAX_INTERNS_PER_MENTOR') ?? 10);
  return Number.isInteger(value) && value > 0 ? value : 10;
}

export const INTERNSHIP_BASE_SELECT = {
  id: true,
  internId: true,
  programId: true,
  applicationId: true,
  status: true,
  startedAt: true,
  endedAt: true,
  dropReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InternshipSelect;

export const INTERNSHIP_DETAIL_SELECT = {
  ...INTERNSHIP_BASE_SELECT,
  program: { select: { id: true, name: true } },
  intern: {
    select: {
      id: true,
      email: true,
      internProfile: { select: { fullName: true } },
    },
  },
  mentorAssignments: {
    where: { endedAt: null },
    orderBy: { assignedAt: 'desc' },
    take: 1,
    select: {
      staff: {
        select: {
          id: true,
          staffProfile: { select: { fullName: true, workEmail: true } },
        },
      },
    },
  },
} satisfies Prisma.InternshipSelect;

export const ASSIGNMENT_SELECT = {
  id: true,
  internshipId: true,
  staffId: true,
  assignedAt: true,
  endedAt: true,
  assignedById: true,
  createdAt: true,
} satisfies Prisma.MentorAssignmentSelect;

export type InternshipDetailRow = Prisma.InternshipGetPayload<{
  select: typeof INTERNSHIP_DETAIL_SELECT;
}>;