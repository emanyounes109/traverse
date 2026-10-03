import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApplicationStatus,
  InterviewResult,
  InterviewStatus,
  Permission,
  Prisma,
  Role,
  UserStatus,
} from '@prisma/client';
import { ApplicationsService } from '../applications/applications.service';
import { DATE_ONLY } from '../applications/applications.constants';
import { paginated, skipOf } from '../common/pagination/pagination';
import type { AuthUser } from '../common/types/auth-user';
import { validationError } from '../common/utils/errors';
import {
  AppEvents,
  ApplicationStatusChangedEvent,
  InterviewEvent,
} from '../events/app-events';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { ListInterviewsQueryDto } from './dto/list-interviews-query.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import {
  ACTION_TARGET_STATUS,
  ACTIVE_INTERVIEW_STATUSES,
  ELIGIBLE_APPLICATION_STATUSES,
  INTERVIEW_HISTORY_SELECT,
  INTERVIEW_SELECT,
  INTERVIEW_TRANSITIONS,
  InterviewAction,
} from './interviews.constants';

type Tx = Prisma.TransactionClient;
type InterviewRow = Prisma.InterviewGetPayload<{ select: typeof INTERVIEW_SELECT }>;
interface InterviewContext {
  internId: string;
  programId: string;
}

const EVENT_BY_ACTION: Record<InterviewAction, string> = {
  [InterviewAction.RESCHEDULE]: AppEvents.INTERVIEW_RESCHEDULED,
  [InterviewAction.CANCEL]: AppEvents.INTERVIEW_CANCELLED,
  [InterviewAction.COMPLETE]: AppEvents.INTERVIEW_COMPLETED,
};

const interviewNotFound = () =>
  new NotFoundException({ code: 'NOT_FOUND', message: 'Interview not found.' });

const applicationNotFound = () =>
  new NotFoundException({ code: 'NOT_FOUND', message: 'Application not found.' });

const forbidden = () =>
  new ForbiddenException({
    code: 'FORBIDDEN',
    message: "You don't have permission to do that.",
  });

const conflict = (code: string, message: string) =>
  new ConflictException({ code, message });

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly events: EventEmitter2,
  ) {}

  async create(actor: AuthUser, applicationId: string, dto: CreateInterviewDto) {
    const scheduledAt = this.futureDate(dto.scheduledAt);
    await this.assertInterviewer(dto.interviewerId);

    const { interview, app, moved } = await this.prisma
      .$transaction(async (tx) => {
        await this.lockApplication(tx, applicationId);
        const app = await tx.application.findUniqueOrThrow({
          where: { id: applicationId },
          select: { id: true, status: true, internId: true, programId: true },
        });

        if (!ELIGIBLE_APPLICATION_STATUSES.includes(app.status)) {
          throw conflict(
            'APPLICATION_NOT_ELIGIBLE',
            'An interview can only be scheduled for a shortlisted application.',
          );
        }

        const active = await tx.interview.findFirst({
          where: {
            applicationId,
            status: { in: [...ACTIVE_INTERVIEW_STATUSES] },
          },
          select: { id: true },
        });
        if (active) {
          throw conflict(
            'ACTIVE_INTERVIEW_EXISTS',
            'This application already has an active interview.',
          );
        }

        const latest = await tx.interview.findFirst({
          where: { applicationId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: { status: true, result: true },
        });
        if (
          latest &&
          latest.status === InterviewStatus.COMPLETED &&
          latest.result !== InterviewResult.NEEDS_ANOTHER_ROUND
        ) {
          throw conflict(
            'INTERVIEW_ALREADY_DECIDED',
            'The latest interview already has a final result.',
          );
        }

        const created = await tx.interview.create({
          data: {
            applicationId,
            interviewerId: dto.interviewerId,
            scheduledAt,
            status: InterviewStatus.SCHEDULED,
          },
          select: INTERVIEW_SELECT,
        });
        await tx.interviewHistory.create({
          data: {
            interviewId: created.id,
            action: 'CREATED',
            newScheduledAt: scheduledAt,
            newInterviewerId: dto.interviewerId,
            newStatus: InterviewStatus.SCHEDULED,
            changedById: actor.id,
          },
        });

        let moved = false;
        if (app.status === ApplicationStatus.SHORTLISTED) {
          await this.applications.changeStatusInTx(
            tx,
            { id: app.id, status: app.status },
            ApplicationStatus.INTERVIEW,
            actor.id,
            null,
          );
          moved = true;
        }
        return { interview: created, app, moved };
      })
      .catch((e: unknown) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw conflict(
            'ACTIVE_INTERVIEW_EXISTS',
            'This application already has an active interview.',
          );
        }
        throw e;
      });

    this.emitInterview(AppEvents.INTERVIEW_SCHEDULED, interview, app);
    if (moved) {
      const payload: ApplicationStatusChangedEvent = {
        applicationId: app.id,
        internId: app.internId,
        programId: app.programId,
        fromStatus: ApplicationStatus.SHORTLISTED,
        toStatus: ApplicationStatus.INTERVIEW,
      };
      this.emit(AppEvents.APPLICATION_STATUS_CHANGED, payload);
    }
    return interview;
  }

  async update(actor: AuthUser, id: string, dto: UpdateInterviewDto) {
    this.assertBodyFitsAction(dto);

    let newScheduledAt: Date | undefined;
    if (dto.action === InterviewAction.RESCHEDULE) {
      newScheduledAt = this.futureDate(dto.scheduledAt as string);
      if (dto.interviewerId !== undefined) {
        await this.assertInterviewer(dto.interviewerId);
      }
    }

    const target = ACTION_TARGET_STATUS[dto.action];

    const { updated, before } = await this.prisma.$transaction(async (tx) => {
      await this.lockInterview(tx, id);
      const before = await tx.interview.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          interviewerId: true,
          scheduledAt: true,
          status: true,
          application: { select: { internId: true, programId: true } },
        },
      });

      if (!INTERVIEW_TRANSITIONS[before.status].includes(target)) {
        throw conflict(
          'INVALID_TRANSITION',
          `An interview that is ${before.status} can't be changed to ${target}.`,
        );
      }

      let data: Prisma.InterviewUncheckedUpdateInput;
      let history: Omit<
        Prisma.InterviewHistoryUncheckedCreateInput,
        'interviewId' | 'changedById'
      >;

      switch (dto.action) {
        case InterviewAction.RESCHEDULE: {
          const newInterviewerId = dto.interviewerId ?? before.interviewerId;
          data = {
            scheduledAt: newScheduledAt,
            interviewerId: newInterviewerId,
            status: target,
          };
          history = {
            action: 'RESCHEDULED',
            oldScheduledAt: before.scheduledAt,
            newScheduledAt,
            oldInterviewerId: before.interviewerId,
            newInterviewerId,
            oldStatus: before.status,
            newStatus: target,
          };
          break;
        }
        case InterviewAction.CANCEL: {
          data = { status: target, cancelReason: dto.reason };
          history = {
            action: 'CANCELLED',
            oldStatus: before.status,
            newStatus: target,
            note: dto.reason,
          };
          break;
        }
        default: {
          data = { status: target, result: dto.result, notes: dto.notes };
          history = {
            action: 'COMPLETED',
            oldStatus: before.status,
            newStatus: target,
            note: `Result: ${dto.result}`,
          };
        }
      }

      const updated = await tx.interview.update({
        where: { id },
        data,
        select: INTERVIEW_SELECT,
      });
      await tx.interviewHistory.create({
        data: { interviewId: id, ...history, changedById: actor.id },
      });
      return { updated, before };
    });

    const extra =
      dto.action === InterviewAction.RESCHEDULE
        ? { oldScheduledAt: before.scheduledAt }
        : {};
    this.emitInterview(EVENT_BY_ACTION[dto.action], updated, before.application, extra);
    return updated;
  }

  async list(user: AuthUser, query: ListInterviewsQueryDto) {
    if (!this.hasViewPermission(user)) throw forbidden();

    const now = new Date();
    const and: Prisma.InterviewWhereInput[] = [];
    if (query.status) and.push({ status: query.status });
    if (query.interviewerId) and.push({ interviewerId: query.interviewerId });
    const range = this.dateRange(query.from, query.to);
    if (range) and.push({ scheduledAt: range });
    if (query.upcoming === true) {
      and.push({
        status: { in: [...ACTIVE_INTERVIEW_STATUSES] },
        scheduledAt: { gte: now },
      });
    }

    const where: Prisma.InterviewWhereInput = and.length ? { AND: and } : {};
    const orderBy = (
      query.upcoming === true
        ? [{ scheduledAt: 'asc' }, { id: 'asc' }]
        : [{ [query.sortBy]: query.order }, { id: 'asc' }]
    ) as Prisma.InterviewOrderByWithRelationInput[];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.interview.count({ where }),
      this.prisma.interview.findMany({
        where,
        orderBy,
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: {
          id: true,
          status: true,
          result: true,
          scheduledAt: true,
          interviewer: {
            select: {
              id: true,
              staffProfile: { select: { fullName: true } },
            },
          },
          application: {
            select: {
              id: true,
              status: true,
              program: { select: { id: true, name: true } },
              intern: {
                select: {
                  id: true,
                  internProfile: { select: { fullName: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      status: r.status,
      result: r.result,
      scheduledAt: r.scheduledAt,
      interviewer: {
        id: r.interviewer.id,
        fullName: r.interviewer.staffProfile?.fullName ?? null,
      },
      application: { id: r.application.id, status: r.application.status },
      applicant: {
        id: r.application.intern.id,
        fullName: r.application.intern.internProfile?.fullName ?? null,
      },
      program: r.application.program,
    }));
    return paginated(data, total, query.page, query.limit);
  }

  async getOne(user: AuthUser, id: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      select: {
        ...INTERVIEW_SELECT,
        application: {
          select: { id: true, status: true, internId: true, programId: true },
        },
        history: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: INTERVIEW_HISTORY_SELECT,
        },
      },
    });
    if (!interview) throw interviewNotFound();
    this.assertCanView(user, interview.application.internId);

    const { application, history, ...base } = interview;
    const isStaff = user.role === Role.STAFF;
    const { notes: _notes, ...baseWithoutNotes } = base;

    return {
      ...(isStaff ? base : baseWithoutNotes),
      application,
      history: isStaff ? history : history.map(({ note: _note, ...h }) => h),
    };
  }

  async listForApplication(user: AuthUser, applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { internId: true },
    });
    if (!application) throw applicationNotFound();
    this.assertCanView(user, application.internId);

    const rows = await this.prisma.interview.findMany({
      where: { applicationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: INTERVIEW_SELECT,
    });
    return user.role === Role.STAFF
      ? rows
      : rows.map(({ notes: _notes, ...r }) => r);
  }

  private assertBodyFitsAction(dto: UpdateInterviewDto) {
    const allowed: Record<InterviewAction, string[]> = {
      [InterviewAction.RESCHEDULE]: ['scheduledAt', 'interviewerId'],
      [InterviewAction.CANCEL]: ['reason'],
      [InterviewAction.COMPLETE]: ['result', 'notes'],
    };
    const optional = ['scheduledAt', 'interviewerId', 'reason', 'result', 'notes'];
    const body = dto as unknown as Record<string, unknown>;

    const extra = optional.filter(
      (f) => body[f] !== undefined && !allowed[dto.action].includes(f),
    );
    if (extra.length > 0) {
      throw validationError(
        extra.map((f) => `${f} is not allowed for ${dto.action}`),
      );
    }
  }

  private async assertInterviewer(interviewerId: string) {
    const staff = await this.prisma.user.findFirst({
      where: { id: interviewerId, role: Role.STAFF, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    if (!staff) {
      throw new BadRequestException({
        code: 'INVALID_INTERVIEWER',
        message: 'The interviewer must be an active staff member.',
      });
    }
  }

  private futureDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: 'SCHEDULED_AT_IN_PAST',
        message: 'The interview must be scheduled in the future.',
      });
    }
    return date;
  }

  private hasViewPermission(user: AuthUser): boolean {
    return (
      user.role === Role.STAFF &&
      (user.permissions.includes(Permission.CAN_MANAGE_INTERVIEWS) ||
        user.permissions.includes(Permission.CAN_REVIEW_APPLICATIONS))
    );
  }

  private assertCanView(user: AuthUser, applicantId: string) {
    if (user.role === Role.INTERN) {
      if (applicantId !== user.id) throw forbidden();
      return;
    }
    if (!this.hasViewPermission(user)) throw forbidden();
  }

  private dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    if (!from && !to) return undefined;

    if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'from must not be after to.',
      });
    }

    const filter: Prisma.DateTimeFilter = {};
    if (from) filter.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      if (DATE_ONLY.test(to)) filter.lt = new Date(end.getTime() + 86_400_000);
      else filter.lte = end;
    }
    return filter;
  }

  private async lockApplication(tx: Tx, id: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Application" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (rows.length === 0) throw applicationNotFound();
  }

  private async lockInterview(tx: Tx, id: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Interview" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (rows.length === 0) throw interviewNotFound();
  }

  private emitInterview(
    event: string,
    interview: InterviewRow,
    ctx: InterviewContext,
    extra: object = {},
  ) {
    const payload: InterviewEvent = {
      interviewId: interview.id,
      applicationId: interview.applicationId,
      internId: ctx.internId,
      programId: ctx.programId,
      interviewerId: interview.interviewerId,
      scheduledAt: interview.scheduledAt,
      status: interview.status,
      ...(interview.result ? { result: interview.result } : {}),
      occurredAt: new Date(),
    };
    this.emit(event, { ...payload, ...extra });
  }

  // Events run after the commit and must never break the request.
  private emit(event: string, payload: object) {
    try {
      this.events.emit(event, payload);
      this.logger.debug(`Emitted ${event} ${JSON.stringify(payload)}`);
    } catch (e) {
      this.logger.error(
        `Failed to emit ${event}`,
        e instanceof Error ? e.stack : undefined,
      );
    }
  }
}