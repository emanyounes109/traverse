import { ApplicationStatus, TaskStatus } from '@prisma/client';

export const TASK_STATUSES = Object.values(TaskStatus);
export const APPLICATION_STATUSES = Object.values(ApplicationStatus);

export function zeroCounts<T extends string>(keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
}