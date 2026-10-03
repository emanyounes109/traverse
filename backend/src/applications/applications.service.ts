import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApplicationStatus,
  InternshipStatus,
  InterviewResult,
  InterviewStatus,
  Permission,
  Prisma,
  ProgramStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import {
  AppEvents,
  ApplicationStatusChangedEvent,
  ApplicationSubmittedEvent,
} from '../events/app-events';
import { PageQueryDto } from '../common/pagination/page-query.dto';
import { paginated, skipOf } from '../common/pagination/pagination';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { ProgramsService } from '../programs/programs.service';
import {
  APPLICATION_CORE_SELECT,
  APPLICATION_SELECT,
  APPLICATION_TRANSITIONS,
  DATE_ONLY,
} from './applications.constants';
import { ChangeApplicationStatusDto } from './dto/change-application-status.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';

type Tx = Prisma.TransactionClient;

export interface ApplicationRef {
  id: string;
  status: ApplicationStatus;
}

const notFound = () =>
  new NotFoundException({ code: 'NOT_FOUND', message: 'Application not found.' });

const forbidden = () =>
  new ForbiddenException({
    code: 'FORBIDDEN',
    message: "You don't have permission to do that.",
  });

const alreadyApplied = () =>
  new ConflictException({
    code: 'ALREADY_APPLIED',
    message: 'You have already applied to this program.',
  });

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly programs: ProgramsService,
    private readonly events: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  async apply(internId: string, dto: CreateApplicationDto) {
    const application = await this.prisma
      .$transaction(async (tx) => {
        const program = await tx.program.findUnique({
          where: { id: dto.programId },
          select: {
            status: true,
            applicationOpenDate: true,
            applicationCloseDate: true,
          },
        });
        if (!program) {
          throw new NotFoundException({
            code: 'NOT_FOUND',
            message: 'Program not found.',
          });
        }
        if (program.status !== ProgramStatus.OPEN) {
          throw new ConflictException({
            code: 'PROGRAM_NOT_OPEN',
            message: 'This program is not open for applications.',
          });
        }

        const now = Date.now();
        if (
          now < program.applicationOpenDate.getTime() ||
          now > program.applicationCloseDate.getTime()
        ) {
          throw new ConflictException({
            code: 'APPLICATION_WINDOW_CLOSED',
            message: 'The application window for this program is closed.',
          });
        }

        const existing = await tx.application.findUnique({
          where: {
            internId_programId: { internId, programId: dto.programId },
          },
          select: { id: true },
        });
        if (existing) throw alreadyApplied();

        if (this.requireCv()) {
          const profile = await tx.internProfile.findUnique({
            where: { userId: internId },
            select: { cvDocumentId: true },
          });
          if (!profile?.cvDocumentId) {
            throw new BadRequestException({
              code: 'CV_REQUIRED',
              message: 'Please upload your CV before applying.',
            });
          }
        }

        const created = await tx.application.create({
          data: {
            internId,
            programId: dto.programId,
            status: ApplicationStatus.APPLIED,
          },
          select: APPLICATION_SELECT,
        });
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: created.id,
            fromStatus: null,
            toStatus: ApplicationStatus.APPLIED,
            changedById: internId,
          },
        });
        return created;
      })
      .catch((e: unknown) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw alreadyApplied();
        }
        throw e;
      });

    await this.emitSubmitted(application);
    return application;
  }

  async listMine(internId: string, query: PageQueryDto) {
    const where: Prisma.ApplicationWhereInput = { internId };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        orderBy: [{ appliedAt: 'desc' }, { id: 'asc' }],
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: APPLICATION_SELECT,
      }),
    ]);
    return paginated(rows, total, query.page, query.limit);
  }

  async list(query: ListApplicationsQueryDto) {
    const and: Prisma.ApplicationWhereInput[] = [];
    if (query.status) and.push({ status: query.status });
    if (query.programId) and.push({ programId: query.programId });
    if (query.search) {
      and.push({
        intern: {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            {
              internProfile: {
                fullName: { contains: query.search, mode: 'insensitive' },
              },
            },
          ],
        },
      });
    }
    const range = this.dateRange(query.appliedFrom, query.appliedTo);
    if (range) and.push({ appliedAt: range });

    const where: Prisma.ApplicationWhereInput = and.length ? { AND: and } : {};
    const orderBy = [
      { [query.sortBy]: query.order },
      { id: 'asc' },
    ] as Prisma.ApplicationOrderByWithRelationInput[];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        orderBy,
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: {
          id: true,
          status: true,
          appliedAt: true,
          program: { select: { id: true, name: true } },
          intern: {
            select: {
              id: true,
              email: true,
              internProfile: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      status: r.status,
      appliedAt: r.appliedAt,
      program: r.program,
      applicant: {
        id: r.intern.id,
        fullName: r.intern.internProfile?.fullName ?? null,
        email: r.intern.email,
      },
    }));
    return paginated(data, total, query.page, query.limit);
  }

  async getOne(user: AuthUser, id: string) {
    const isStaff = user.role === Role.STAFF;
    if (isStaff && !user.permissions.includes(Permission.CAN_REVIEW_APPLICATIONS)) {
      throw forbidden();
    }

    const app = await this.prisma.application.findUnique({
      where: { id },
      select: {
        ...APPLICATION_SELECT,
        intern: {
          select: {
            id: true,
            email: true,
            internProfile: {
              select: { fullName: true, cvDocumentId: true },
            },
          },
        },
        statusHistory: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            note: true,
            changedById: true,
            createdAt: true,
          },
        },
        interviews: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            interviewerId: true,
            scheduledAt: true,
            status: true,
            result: true,
            notes: true,
            cancelReason: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    if (!app) throw notFound();
    if (!isStaff && app.internId !== user.id) throw forbidden();

    const { intern, statusHistory, interviews, ...base } = app;
    return {
      ...base,
      intern: {
        id: intern.id,
        fullName: intern.internProfile?.fullName ?? null,
        email: intern.email,
        cvDocumentId: intern.internProfile?.cvDocumentId ?? null,
      },
      history: isStaff
        ? statusHistory
        : statusHistory.map(({ note: _note, ...h }) => h),
      interviews: isStaff
        ? interviews
        : interviews.map(({ notes: _notes, ...i }) => i),
    };
  }

  async changeStatus(
    actor: AuthUser,
    id: string,
    dto: ChangeApplicationStatusDto,
  ) {
    if (dto.toStatus === ApplicationStatus.INTERVIEW) {
      throw new BadRequestException({
        code: 'USE_INTERVIEW_ENDPOINT',
        message: 'To move an application to INTERVIEW, schedule an interview.',
      });
    }
    const note = dto.note?.length ? dto.note : null;

    if (dto.toStatus === ApplicationStatus.ACCEPTED) {
      return this.accept(actor.id, id, note);
    }

    const { updated, fromStatus } = await this.prisma.$transaction(
      async (tx) => {
        const application = await tx.application.findUnique({
          where: { id },
          select: { id: true, status: true },
        });
        if (!application) throw notFound();

        const updated = await this.changeStatusInTx(
          tx,
          application,
          dto.toStatus,
          actor.id,
          note,
        );
        return { updated, fromStatus: application.status };
      },
    );

    this.emitStatusChanged(updated, fromStatus);
    return updated;
  }

  // Reused by the Interviews step (SHORTLISTED -> INTERVIEW). Emits no event:
  // the caller emits after its transaction commits.
  async changeStatusInTx(
    tx: Tx,
    application: ApplicationRef,
    toStatus: ApplicationStatus,
    actorId: string,
    note?: string | null,
  ) {
    this.assertTransition(application.status, toStatus);

    const moved = await tx.application.updateMany({
      where: { id: application.id, status: application.status },
      data: { status: toStatus },
    });
    if (moved.count === 0) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message:
          'The application status changed in the meantime. Please reload and try again.',
      });
    }

    await tx.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: application.status,
        toStatus,
        note: note ?? null,
        changedById: actorId,
      },
    });

    return tx.application.findUniqueOrThrow({
      where: { id: application.id },
      select: APPLICATION_CORE_SELECT,
    });
  }

  private async accept(actorId: string, id: string, note: string | null) {
    const { updated, fromStatus, internshipId } = await this.prisma.$transaction(
      async (tx) => {
        const found = await tx.application.findUnique({
          where: { id },
          select: { programId: true },
        });
        if (!found) throw notFound();

        await this.lockProgram(tx, found.programId);

        const application = await tx.application.findUniqueOrThrow({
          where: { id },
          select: { id: true, status: true, internId: true, programId: true },
        });
        this.assertTransition(application.status, ApplicationStatus.ACCEPTED);

        const latest = await tx.interview.findFirst({
          where: { applicationId: id },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: { status: true, result: true },
        });
        if (
          !latest ||
          latest.status !== InterviewStatus.COMPLETED ||
          latest.result !== InterviewResult.PASSED
        ) {
          throw new ConflictException({
            code: 'INTERVIEW_NOT_PASSED',
            message:
              'The latest interview must be completed and passed before accepting.',
          });
        }

        const program = await tx.program.findUniqueOrThrow({
          where: { id: application.programId },
          select: { capacity: true },
        });
        const accepted = await this.programs.getAcceptedCount(
          application.programId,
          tx,
        );
        if (accepted >= program.capacity) {
          throw new ConflictException({
            code: 'PROGRAM_FULL',
            message: 'This program has no seats left.',
          });
        }

        const updated = await this.changeStatusInTx(
          tx,
          application,
          ApplicationStatus.ACCEPTED,
          actorId,
          note,
        );

        const internship = await tx.internship.create({
          data: {
            internId: application.internId,
            applicationId: application.id,
            programId: application.programId,
            status: InternshipStatus.ACCEPTED,
          },
          select: { id: true },
        });
        await tx.internshipStatusHistory.create({
          data: {
            internshipId: internship.id,
            fromStatus: null,
            toStatus: InternshipStatus.ACCEPTED,
            changedById: actorId,
          },
        });

        return {
          updated,
          fromStatus: application.status,
          internshipId: internship.id,
        };
      },
    );

    this.emitStatusChanged(updated, fromStatus);
    return { ...updated, internshipId };
  }

  private assertTransition(from: ApplicationStatus, to: ApplicationStatus) {
    if (!APPLICATION_TRANSITIONS[from].includes(to)) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `An application that is ${from} can't be changed to ${to}.`,
      });
    }
  }

  private requireCv(): boolean {
    return this.config.get<string>('REQUIRE_CV_TO_APPLY') !== 'false';
  }

  private dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    if (!from && !to) return undefined;

    if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'appliedFrom must not be after appliedTo.',
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

  // Locks the program row so parallel accepts can't exceed the capacity.
  private async lockProgram(tx: Tx, programId: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Program" WHERE "id" = ${programId}::uuid FOR UPDATE`;
    if (rows.length === 0) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Program not found.',
      });
    }
  }

  private async emitSubmitted(application: {
    id: string;
    internId: string;
    programId: string;
  }) {
    let recipientUserIds: string[] = [];
    try {
      const staff = await this.prisma.user.findMany({
        where: {
          role: Role.STAFF,
          status: UserStatus.ACTIVE,
          staffProfile: {
            is: { permissions: { has: Permission.CAN_REVIEW_APPLICATIONS } },
          },
        },
        select: { id: true },
      });
      recipientUserIds = staff.map((s) => s.id);
    } catch (e) {
      this.logger.error(
        'Could not load recipients for application.submitted',
        e instanceof Error ? e.stack : undefined,
      );
    }

    const payload: ApplicationSubmittedEvent = {
      applicationId: application.id,
      internId: application.internId,
      programId: application.programId,
      recipientUserIds,
    };
    this.emit(AppEvents.APPLICATION_SUBMITTED, payload);
  }

  private emitStatusChanged(
    updated: { id: string; internId: string; programId: string; status: ApplicationStatus },
    fromStatus: ApplicationStatus,
  ) {
    const payload: ApplicationStatusChangedEvent = {
      applicationId: updated.id,
      internId: updated.internId,
      programId: updated.programId,
      fromStatus,
      toStatus: updated.status,
    };
    this.emit(AppEvents.APPLICATION_STATUS_CHANGED, payload);
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