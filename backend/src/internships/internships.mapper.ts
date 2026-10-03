import type { InternshipDetailRow } from './internships.constants';

export interface ProgressInfo {
  progress: number;
  taskCounts: { total: number; approved: number };
}

export const emptyProgress = (): ProgressInfo => ({
  progress: 0,
  taskCounts: { total: 0, approved: 0 },
});

function currentMentor(row: InternshipDetailRow) {
  const staff = row.mentorAssignments[0]?.staff;
  if (!staff) return null;
  return {
    id: staff.id,
    fullName: staff.staffProfile?.fullName ?? null,
    workEmail: staff.staffProfile?.workEmail ?? null,
  };
}

export function toInternshipDetail(row: InternshipDetailRow, info: ProgressInfo) {
  return {
    id: row.id,
    internId: row.internId,
    programId: row.programId,
    applicationId: row.applicationId,
    status: row.status,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    dropReason: row.dropReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    program: row.program,
    intern: {
      id: row.intern.id,
      fullName: row.intern.internProfile?.fullName ?? null,
      email: row.intern.email,
    },
    mentor: currentMentor(row),
    progress: info.progress,
    taskCounts: info.taskCounts,
  };
}

export function toInternListItem(row: InternshipDetailRow, info: ProgressInfo) {
  const mentor = currentMentor(row);
  return {
    internId: row.internId,
    fullName: row.intern.internProfile?.fullName ?? null,
    email: row.intern.email,
    internshipId: row.id,
    status: row.status,
    program: row.program,
    mentor: mentor ? { id: mentor.id, fullName: mentor.fullName } : null,
    progress: info.progress,
  };
}