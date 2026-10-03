import { TaskStatus } from '@prisma/client';
import type { TaskDetailRow, TaskListRow } from './tasks.constants';

export function isOverdue(
  task: { deadline: Date; status: TaskStatus },
  now: Date = new Date(),
): boolean {
  return (
    task.deadline.getTime() < now.getTime() && task.status !== TaskStatus.APPROVED
  );
}

export function toTaskResponse<T extends { deadline: Date; status: TaskStatus }>(
  task: T,
  now: Date = new Date(),
) {
  return { ...task, isOverdue: isOverdue(task, now) };
}

export function toTaskListItem(row: TaskListRow, now: Date = new Date()) {
  const { intern, submissions, ...base } = row;
  return {
    ...base,
    isOverdue: isOverdue(base, now),
    intern: {
      id: intern.id,
      fullName: intern.internProfile?.fullName ?? null,
    },
    latestSubmission: submissions[0] ?? null,
  };
}

export function toTaskDetail(row: TaskDetailRow, now: Date = new Date()) {
  const { intern, submissions, feedbacks, ...base } = row;
  return {
    ...base,
    isOverdue: isOverdue(base, now),
    intern: {
      id: intern.id,
      fullName: intern.internProfile?.fullName ?? null,
    },
    latestSubmission: submissions[0] ?? null,
    feedback: feedbacks.map((f) => ({
      id: f.id,
      submissionId: f.submissionId,
      comment: f.comment,
      createdAt: f.createdAt,
      staff: {
        id: f.staff.id,
        fullName: f.staff.staffProfile?.fullName ?? null,
      },
    })),
  };
}