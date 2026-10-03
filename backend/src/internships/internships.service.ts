import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Prisma,
  Role,
  TaskStatus,
  UserStatus,
  InternshipStatus,
} from '@prisma/client';
import type { AuthUser } from '../common/types/auth-user';
import {
  AppEvents,
  InternshipStatusChangedEvent,
  MentorAssignedEvent,
} from '../events/app-events';
import { PrismaService } from '../prisma/prisma.service';
import { StaffVisibilityService } from '../visibility/staff-visibility.service';
import { AssignMentorDto } from './dto/assign-mentor.dto';
import { ChangeInternshipStatusDto } from './dto/change-internship-status.dto';
import { badRequest, conflict, forbidden, notFound } from './internships.errors';
import {
  ASSIGNMENT_SELECT,
  INTERNSHIP_BASE_SELECT,
  INTERNSHIP_DETAIL_SELECT,
  INTERNSHIP_TRANSITIONS,
  OPEN_INTERNSHIP_STATUSES,
  maxInternsPerMentor,
} from './internships.constants';
import {
  ProgressInfo,
  emptyProgress,
  toInternshipDetail,
} from './internships.mapper';

type Tx = Prisma.TransactionClient;

const internshipNotFound = () => notFound('Internship not found.');

@Injectable()
export class InternshipsService {
  private readonly logger = new Logger(InternshipsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: StaffVisibilityService,
    private readonly events: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  // progress = round(APPROVED tasks / all tasks * 100); 0 when there are no tasks.
  async getProgress(internshipIds: string[]): Promise<Map<string, ProgressInfo>> {
    const map = new Map<string, ProgressInfo>();
    for (const id of internshipIds) map.set(id, emptyProgress());
    if (internshipIds.length === 0) return map;

    const rows = await this.prisma.task.groupBy({
      by: ['internshipId', 'status'],
      where: { internshipId: { in: internshipIds } },
      _count: { _all: true },
    });

    for (const row of rows) {
      const entry = map.get(row.internshipId);
      if (!entry) continue;
      entry.taskCounts.total += row._count._all;
      if (row.status === TaskStatus.APPROVED) {
        entry.taskCounts.approved += row._count._all;
      }
    }
    for (const entry of map.values()) {
      entry.progress =
        entry.taskCounts.total === 0
          ? 0
          : Math.round((entry.taskCounts.approved / entry.taskCounts.total) * 100);
    }
    return map;
  }

  async getMine(internId: string) {
    const row = await this.prisma.internship.findFirst({
      where: { internId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: INTERNSHIP_DETAIL_SELECT,
    });
    if (!row) throw internshipNotFound();

    const progress = await this.getProgress([row.id]);
    return toInternshipDetail(row, progress.get(row.id) ?? emptyProgress());
  }

  async getOne(user: AuthUser, id: string) {
    const row = await this.prisma.internship.findUnique({
      where: { id },
      select: INTERNSHIP_DETAIL_SELECT,
    });
    if (!row) throw internshipNotFound();
    if (!(await this.visibility.canAccessIntern(user, row.internId))) {
      throw forbidden();
    }

    const progress = await this.getProgress([row.id]);
    return toInternshipDetail(row, progress.get(row.id) ?? emptyProgress());
  }

  async history(user: AuthUser, id: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      select: { internId: true },
    });
    if (!internship) throw internshipNotFound();
    if (!(await this.visibility.canAccessIntern(user, internship.internId))) {
      throw forbidden();
    }

    const rows = await this.prisma.internshipStatusHistory.findMany({
      where: { internshipId: id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        note: true,
        createdAt: true,
        changedBy: {
          select: {
            id: true,
            staffProfile: { select: { fullName: true } },
            internProfile: { select: { fullName: true } },
          },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      fromStatus: r.fromStatus,
      toStatus: r.toStatus,
      note: r.note,
      createdAt: r.createdAt,
      changedBy: {
        id: r.changedBy.id,
        fullName:
          r.changedBy.staffProfile?.fullName ??
          r.changedBy.internProfile?.fullName ??
          null,
      },
    }));
  }

  async changeStatus(user: AuthUser, id: string, dto: ChangeInternshipStatusDto) {
    const found = await this.prisma.internship.findUnique({
      where: { id },
      select: { internId: true },
    });
    if (!found) throw internshipNotFound();
    if (!(await this.visibility.canViewIntern(user, found.internId))) {
      throw forbidden();
    }

    const reason = dto.reason?.length ? dto.reason : null;

    const { updated, current, incomplete } = await this.prisma.$transaction(
      async (tx) => {
        await this.lockInternship(tx, id);
        const current = await tx.internship.findUniqueOrThrow({
          where: { id },
          select: { id: true, internId: true, programId: true, status: true },
        });

        if (!INTERNSHIP_TRANSITIONS[current.status].includes(dto.toStatus)) {
          throw conflict(
            'INVALID_TRANSITION',
            `An internship that is ${current.status} can't be changed to ${dto.toStatus}.`,
          );
        }

        if (dto.toStatus === InternshipStatus.ACTIVE) {
          const mentors = await tx.mentorAssignment.count({
            where: { internshipId: id, endedAt: null },
          });
          if (mentors === 0) {
            throw conflict(
              'MENTOR_REQUIRED',
              'Assign a mentor before activating the internship.',
            );
          }
        }

        const now = new Date();
        const data: Prisma.InternshipUpdateInput = { status: dto.toStatus };
        if (dto.toStatus === InternshipStatus.ACTIVE) data.startedAt = now;
        if (dto.toStatus === InternshipStatus.COMPLETED) data.endedAt = now;
        if (dto.toStatus === InternshipStatus.DROPPED) {
          data.endedAt = now;
          data.dropReason = reason;
        }

        const updated = await tx.internship.update({
          where: { id },
          data,
          select: INTERNSHIP_BASE_SELECT,
        });
        await tx.internshipStatusHistory.create({
          data: {
            internshipId: id,
            fromStatus: current.status,
            toStatus: dto.toStatus,
            note: reason,
            changedById: user.id,
          },
        });

        const incomplete =
          dto.toStatus === InternshipStatus.COMPLETED
            ? await tx.task.count({
                where: {
                  internshipId: id,
                  status: { not: TaskStatus.APPROVED },
                },
              })
            : 0;

        return { updated, current, incomplete };
      },
    );

    const payload: InternshipStatusChangedEvent = {
      internshipId: id,
      internId: current.internId,
      programId: current.programId,
      fromStatus: current.status,
      toStatus: dto.toStatus,
      occurredAt: new Date(),
    };
    this.emit(AppEvents.INTERNSHIP_STATUS_CHANGED, payload);

    return {
      ...updated,
      ...(incomplete > 0
        ? { warning: 'INCOMPLETE_TASKS', incompleteTaskCount: incomplete }
        : {}),
    };
  }

  async assignMentor(user: AuthUser, id: string, dto: AssignMentorDto) {
    const found = await this.prisma.internship.findUnique({
      where: { id },
      select: { internId: true },
    });
    if (!found) throw internshipNotFound();
    if (!(await this.visibility.canViewIntern(user, found.internId))) {
      throw forbidden();
    }

    const mentor = await this.prisma.user.findFirst({
      where: { id: dto.staffId, role: Role.STAFF, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    if (!mentor) {
      throw badRequest(
        'INVALID_MENTOR',
        'The mentor must be an active staff member.',
      );
    }

    const result = await this.prisma
      .$transaction(async (tx) => {
        await this.lockInternship(tx, id);
        const internship = await tx.internship.findUniqueOrThrow({
          where: { id },
          select: { id: true, internId: true, programId: true, status: true },
        });

        if (!OPEN_INTERNSHIP_STATUSES.includes(internship.status)) {
          throw conflict(
            'INTERNSHIP_CLOSED',
            'A mentor can only be assigned to an open internship.',
          );
        }

        const current = await tx.mentorAssignment.findFirst({
          where: { internshipId: id, endedAt: null },
          select: { id: true, staffId: true },
        });
        if (current && current.staffId === dto.staffId) {
          throw conflict(
            'ALREADY_CURRENT_MENTOR',
            'This staff member is already the current mentor.',
          );
        }

        const activeCount = await tx.mentorAssignment.count({
          where: {
            staffId: dto.staffId,
            endedAt: null,
            internship: {
              id: { not: id },
              status: { in: [...OPEN_INTERNSHIP_STATUSES] },
            },
          },
        });

        const now = new Date();
        if (current) {
          await tx.mentorAssignment.update({
            where: { id: current.id },
            data: { endedAt: now },
          });
        }
        const created = await tx.mentorAssignment.create({
          data: {
            internshipId: id,
            staffId: dto.staffId,
            assignedAt: now,
            assignedById: user.id,
          },
          select: ASSIGNMENT_SELECT,
        });

        return {
          created,
          internship,
          previousMentorId: current?.staffId,
          atCapacity: activeCount >= maxInternsPerMentor(this.config),
        };
      })
      .catch((e: unknown) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw conflict(
            'ACTIVE_MENTOR_EXISTS',
            'This internship already has an active mentor. Please try again.',
          );
        }
        throw e;
      });

    const payload: MentorAssignedEvent = {
      internshipId: id,
      internId: result.internship.internId,
      programId: result.internship.programId,
      mentorId: dto.staffId,
      ...(result.previousMentorId
        ? { previousMentorId: result.previousMentorId }
        : {}),
      occurredAt: new Date(),
    };
    this.emit(AppEvents.MENTOR_ASSIGNED, payload);

    return {
      ...result.created,
      ...(result.atCapacity ? { warning: 'MENTOR_AT_CAPACITY' } : {}),
    };
  }

  private async lockInternship(tx: Tx, id: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Internship" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (rows.length === 0) throw internshipNotFound();
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