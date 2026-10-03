import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType, Prisma } from '@prisma/client';
import {
  AppEvents,
  ApplicationStatusChangedEvent,
  ApplicationSubmittedEvent,
  InternshipStatusChangedEvent,
  InterviewEvent,
  InterviewRescheduledEvent,
  MentorAssignedEvent,
  TaskAssignedEvent,
  TaskDeadlineApproachingEvent,
  TaskFeedbackGivenEvent,
  TaskReviewedEvent,
} from '../events/app-events';
import { PrismaService } from '../prisma/prisma.service';
import { toIso } from './notifications.constants';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(AppEvents.APPLICATION_SUBMITTED)
  onApplicationSubmitted(e: ApplicationSubmittedEvent) {
    return this.handle(
      AppEvents.APPLICATION_SUBMITTED,
      e.recipientUserIds,
      NotificationType.APPLICATION_SUBMITTED,
      async () => ({
        applicationId: e.applicationId,
        internId: e.internId,
        programId: e.programId,
        programName: await this.programName(e.programId),
      }),
    );
  }

  @OnEvent(AppEvents.APPLICATION_STATUS_CHANGED)
  onApplicationStatusChanged(e: ApplicationStatusChangedEvent) {
    return this.handle(
      AppEvents.APPLICATION_STATUS_CHANGED,
      [e.internId],
      NotificationType.APPLICATION_STATUS_CHANGED,
      async () => ({
        applicationId: e.applicationId,
        programId: e.programId,
        programName: await this.programName(e.programId),
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
      }),
    );
  }

  @OnEvent(AppEvents.INTERVIEW_SCHEDULED)
  onInterviewScheduled(e: InterviewEvent) {
    return this.handle(
      AppEvents.INTERVIEW_SCHEDULED,
      [e.internId],
      NotificationType.INTERVIEW_SCHEDULED,
      () => this.interviewPayload(e),
    );
  }

  @OnEvent(AppEvents.INTERVIEW_RESCHEDULED)
  onInterviewRescheduled(e: InterviewRescheduledEvent) {
    return this.handle(
      AppEvents.INTERVIEW_RESCHEDULED,
      [e.internId],
      NotificationType.INTERVIEW_RESCHEDULED,
      () =>
        this.interviewPayload(e, { oldScheduledAt: toIso(e.oldScheduledAt) }),
    );
  }

  @OnEvent(AppEvents.INTERVIEW_CANCELLED)
  onInterviewCancelled(e: InterviewEvent) {
    return this.handle(
      AppEvents.INTERVIEW_CANCELLED,
      [e.internId],
      NotificationType.INTERVIEW_CANCELLED,
      () => this.interviewPayload(e),
    );
  }

  @OnEvent(AppEvents.TASK_ASSIGNED)
  onTaskAssigned(e: TaskAssignedEvent) {
    return this.handle(
      AppEvents.TASK_ASSIGNED,
      [e.internId],
      NotificationType.TASK_ASSIGNED,
      async () => ({
        taskId: e.taskId,
        internshipId: e.internshipId,
        taskTitle: e.title,
        deadline: toIso(e.deadline),
      }),
    );
  }

  @OnEvent(AppEvents.TASK_DEADLINE_APPROACHING)
  onTaskDeadlineApproaching(e: TaskDeadlineApproachingEvent) {
    return this.handle(
      AppEvents.TASK_DEADLINE_APPROACHING,
      [e.internId],
      NotificationType.TASK_DEADLINE_APPROACHING,
      async () => ({
        taskId: e.taskId,
        internshipId: e.internshipId,
        taskTitle: e.title,
        deadline: toIso(e.deadline),
      }),
    );
  }

  @OnEvent(AppEvents.TASK_REVIEWED)
  onTaskReviewed(e: TaskReviewedEvent) {
    return this.handle(
      AppEvents.TASK_REVIEWED,
      [e.internId],
      NotificationType.SUBMISSION_REVIEWED,
      async () => {
        const task = await this.taskInfo(e.taskId);
        return {
          taskId: e.taskId,
          internshipId: e.internshipId,
          taskTitle: task?.title ?? null,
          deadline: toIso(task?.deadline),
          decision: e.decision,
          status: e.status,
        };
      },
    );
  }

  @OnEvent(AppEvents.TASK_FEEDBACK_GIVEN)
  onTaskFeedbackGiven(e: TaskFeedbackGivenEvent) {
    return this.handle(
      AppEvents.TASK_FEEDBACK_GIVEN,
      [e.internId],
      NotificationType.FEEDBACK_RECEIVED,
      async () => {
        const task = await this.taskInfo(e.taskId);
        return {
          taskId: e.taskId,
          internshipId: task?.internshipId ?? null,
          feedbackId: e.feedbackId,
          taskTitle: task?.title ?? null,
          deadline: toIso(task?.deadline),
        };
      },
    );
  }

  @OnEvent(AppEvents.MENTOR_ASSIGNED)
  onMentorAssigned(e: MentorAssignedEvent) {
    return this.handle(
      AppEvents.MENTOR_ASSIGNED,
      [e.internId],
      NotificationType.MENTOR_ASSIGNED,
      async () => ({
        internshipId: e.internshipId,
        programId: e.programId,
        programName: await this.programName(e.programId),
        mentorId: e.mentorId,
        mentorName: await this.staffName(e.mentorId),
        previousMentorId: e.previousMentorId ?? null,
      }),
    );
  }

  @OnEvent(AppEvents.INTERNSHIP_STATUS_CHANGED)
  onInternshipStatusChanged(e: InternshipStatusChangedEvent) {
    return this.handle(
      AppEvents.INTERNSHIP_STATUS_CHANGED,
      [e.internId],
      NotificationType.INTERNSHIP_STATUS_CHANGED,
      async () => ({
        internshipId: e.internshipId,
        programId: e.programId,
        programName: await this.programName(e.programId),
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
      }),
    );
  }

  // ---------- helpers ----------

  // A listener must never throw into the code that emitted the event.
  private async handle(
    event: string,
    recipients: string[],
    type: NotificationType,
    build: () => Promise<Prisma.InputJsonObject>,
  ): Promise<void> {
    try {
      if (recipients.length === 0) return;
      await this.notifications.create(recipients, type, await build());
    } catch (e) {
      this.logger.error(
        `Could not create the notification for ${event}`,
        e instanceof Error ? e.stack : undefined,
      );
    }
  }

  private async interviewPayload(
    e: InterviewEvent,
    extra: Prisma.InputJsonObject = {},
  ): Promise<Prisma.InputJsonObject> {
    return {
      interviewId: e.interviewId,
      applicationId: e.applicationId,
      programId: e.programId,
      programName: await this.programName(e.programId),
      scheduledAt: toIso(e.scheduledAt),
      ...extra,
    };
  }

  private async programName(programId: string): Promise<string | null> {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: { name: true },
    });
    return program?.name ?? null;
  }

  private async staffName(userId: string): Promise<string | null> {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { userId },
      select: { fullName: true },
    });
    return staff?.fullName ?? null;
  }

  private taskInfo(taskId: string) {
    return this.prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, deadline: true, internshipId: true },
    });
  }
}