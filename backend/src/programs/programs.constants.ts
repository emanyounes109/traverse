import { ProgramStatus } from '@prisma/client';

export const PROGRAM_TRANSITIONS: Record<ProgramStatus, readonly ProgramStatus[]> =
  {
    [ProgramStatus.DRAFT]: [ProgramStatus.OPEN, ProgramStatus.ARCHIVED],
    [ProgramStatus.OPEN]: [ProgramStatus.CLOSED],
    [ProgramStatus.CLOSED]: [ProgramStatus.IN_PROGRESS, ProgramStatus.ARCHIVED],
    [ProgramStatus.IN_PROGRESS]: [ProgramStatus.COMPLETED],
    [ProgramStatus.COMPLETED]: [ProgramStatus.ARCHIVED],
    [ProgramStatus.ARCHIVED]: [],
  };

export const EDITABLE_AFTER_DRAFT: readonly string[] = [
  'description',
  'requirements',
  'capacity',
];

export const PROGRAM_DATE_FIELDS: readonly string[] = [
  'applicationOpenDate',
  'applicationCloseDate',
  'internshipStartDate',
  'internshipEndDate',
];