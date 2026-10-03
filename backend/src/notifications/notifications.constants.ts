import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

export const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  payload: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export function reminderHours(config: ConfigService): number {
  const hours = Number(config.get<string>('REMINDER_HOURS_BEFORE') ?? 24);
  return Number.isFinite(hours) && hours > 0 ? hours : 24;
}

export function toIso(value: Date | string | null | undefined): string | null {
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : null;
}