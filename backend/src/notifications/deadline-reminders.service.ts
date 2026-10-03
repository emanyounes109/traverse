import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  InternshipStatus,
  NotificationType,
  TaskStatus,
} from '@prisma/client';
import { AppEvents, TaskDeadlineApproachingEvent } from '../events/app-events';
import { PrismaService } from '../prisma/prisma.service';
import { reminderHours } from './notifications.constants';

const CHUNK_SIZE = 200;

@Injectable()
export class DeadlineRemindersService {
  private readonly logger = new Logger(DeadlineRemindersService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    try {
      await this.runDeadlineReminders();
    } catch (e) {
      this.logger.error(
        'Deadline reminder job failed',
        e instanceof Error ? e.stack : undefined,
      );
    }
  }

  async runDeadlineReminders(): Promise<{
    due: number;
    alreadyReminded: number;
    emitted: number;
  }> {
    if (this.running) return { due: 0, alreadyReminded: 0, emitted: 0 };
    this.running = true;

    try {
      const now = new Date();
      const until = new Date(
        now.getTime() + reminderHours(this.config) * 3_600_000,
      );

      const tasks = await this.prisma.task.findMany({
        where: {
          deadline: { gte: now, lte: until },
          status: { not: TaskStatus.APPROVED },
          internship: {
            status: {
              notIn: [InternshipStatus.COMPLETED, InternshipStatus.DROPPED],
            },
          },
        },
        orderBy: [{ deadline: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          internshipId: true,
          internId: true,
          title: true,
          deadline: true,
        },
      });

      const reminded = await this.alreadyReminded(tasks.map((t) => t.id));
      let emitted = 0;

      for (const task of tasks) {
        if (reminded.has(task.id)) continue;

        const payload: TaskDeadlineApproachingEvent = {
          taskId: task.id,
          internshipId: task.internshipId,
          internId: task.internId,
          title: task.title,
          deadline: task.deadline,
          occurredAt: new Date(),
        };
        try {
          // emitAsync waits for the listener, so the notification exists
          // before the next run can look for it.
          await this.events.emitAsync(AppEvents.TASK_DEADLINE_APPROACHING, payload);
          emitted += 1;
        } catch (e) {
          this.logger.error(
            `Could not send the reminder for task ${task.id}`,
            e instanceof Error ? e.stack : undefined,
          );
        }
      }

      const result = {
        due: tasks.length,
        alreadyReminded: reminded.size,
        emitted,
      };
      if (emitted > 0) {
        this.logger.log(`Deadline reminders: ${JSON.stringify(result)}`);
      }
      return result;
    } finally {
      this.running = false;
    }
  }

  // Tasks that already have a reminder notification (one per task).
  private async alreadyReminded(taskIds: string[]): Promise<Set<string>> {
    const found = new Set<string>();

    for (let i = 0; i < taskIds.length; i += CHUNK_SIZE) {
      const chunk = taskIds.slice(i, i + CHUNK_SIZE);
      const rows = await this.prisma.notification.findMany({
        where: {
          type: NotificationType.TASK_DEADLINE_APPROACHING,
          OR: chunk.map((id) => ({
            payload: { path: ['taskId'], equals: id },
          })),
        },
        select: { payload: true },
      });

      for (const row of rows) {
        const taskId = (row.payload as { taskId?: unknown } | null)?.taskId;
        if (typeof taskId === 'string') found.add(taskId);
      }
    }
    return found;
  }
}