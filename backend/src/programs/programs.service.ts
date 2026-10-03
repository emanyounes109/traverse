import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  Prisma,
  Program,
  ProgramStatus,
  Role,
} from '@prisma/client';
import { paginated, skipOf } from '../common/pagination/pagination';
import type { AuthUser } from '../common/types/auth-user';
import { validationError } from '../common/utils/errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { ListProgramsQueryDto } from './dto/list-programs-query.dto';
import { ListStaffProgramsQueryDto } from './dto/list-staff-programs-query.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import {
  EDITABLE_AFTER_DRAFT,
  PROGRAM_DATE_FIELDS,
  PROGRAM_TRANSITIONS,
} from './programs.constants';

interface ProgramDates {
  applicationOpenDate: Date;
  applicationCloseDate: Date;
  internshipStartDate: Date;
  internshipEndDate: Date;
}

const notFound = () =>
  new NotFoundException({ code: 'NOT_FOUND', message: 'Program not found.' });

const invalidDates = (message: string) =>
  new BadRequestException({ code: 'INVALID_DATES', message });

function assertDates(d: ProgramDates) {
  if (d.applicationOpenDate.getTime() >= d.applicationCloseDate.getTime()) {
    throw invalidDates('applicationOpenDate must be before applicationCloseDate.');
  }
  if (d.applicationCloseDate.getTime() > d.internshipStartDate.getTime()) {
    throw invalidDates(
      'applicationCloseDate must be on or before internshipStartDate.',
    );
  }
  if (d.internshipStartDate.getTime() >= d.internshipEndDate.getTime()) {
    throw invalidDates('internshipStartDate must be before internshipEndDate.');
  }
}

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAcceptedCount(
    programId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    return client.application.count({
      where: { programId, status: ApplicationStatus.ACCEPTED },
    });
  }

  async create(actorId: string, dto: CreateProgramDto) {
    const dates: ProgramDates = {
      applicationOpenDate: new Date(dto.applicationOpenDate),
      applicationCloseDate: new Date(dto.applicationCloseDate),
      internshipStartDate: new Date(dto.internshipStartDate),
      internshipEndDate: new Date(dto.internshipEndDate),
    };
    assertDates(dates);

    const program = await this.prisma.program.create({
      data: {
        name: dto.name,
        description: dto.description,
        requirements: dto.requirements,
        ...dates,
        capacity: dto.capacity,
        status: ProgramStatus.DRAFT,
        createdById: actorId,
      },
    });
    return this.toResponse(program, 0);
  }

  async update(id: string, dto: UpdateProgramDto) {
    const entries = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (entries.some(([, v]) => v === null)) {
      throw validationError(['fields cannot be null']);
    }
    if (entries.length === 0) {
      throw validationError(['at least one field must be provided']);
    }

    const keys = entries.map(([k]) => k);
    const data: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      data[key] = PROGRAM_DATE_FIELDS.includes(key)
        ? new Date(value as string)
        : value;
    }

    return this.prisma.$transaction(async (tx) => {
      await this.lockProgram(tx, id);
      const program = await tx.program.findUniqueOrThrow({ where: { id } });

      if (program.status === ProgramStatus.ARCHIVED) {
        throw new ConflictException({
          code: 'PROGRAM_ARCHIVED',
          message: 'Archived programs cannot be edited.',
        });
      }

      if (program.status !== ProgramStatus.DRAFT) {
        const locked = keys.filter((k) => !EDITABLE_AFTER_DRAFT.includes(k));
        if (locked.length > 0) {
          throw new ConflictException({
            code: 'FIELD_LOCKED',
            message: `These fields can't be changed once the program is no longer a draft: ${locked.join(', ')}.`,
            details: locked,
          });
        }
      }

      if (keys.some((k) => PROGRAM_DATE_FIELDS.includes(k))) {
        const pick = (key: keyof ProgramDates) =>
          (data[key] as Date | undefined) ?? program[key];
        assertDates({
          applicationOpenDate: pick('applicationOpenDate'),
          applicationCloseDate: pick('applicationCloseDate'),
          internshipStartDate: pick('internshipStartDate'),
          internshipEndDate: pick('internshipEndDate'),
        });
      }

      if (data.capacity !== undefined) {
        const accepted = await this.getAcceptedCount(id, tx);
        if ((data.capacity as number) < accepted) {
          throw new ConflictException({
            code: 'CAPACITY_BELOW_ACCEPTED',
            message: `Capacity can't be lower than the ${accepted} interns already accepted.`,
          });
        }
      }

      const updated = await tx.program.update({
        where: { id },
        data: data as Prisma.ProgramUpdateInput,
      });
      return this.toResponse(updated, await this.getAcceptedCount(id, tx));
    });
  }

  publish(id: string) {
    return this.transition(id, ProgramStatus.OPEN);
  }

  close(id: string) {
    return this.transition(id, ProgramStatus.CLOSED);
  }

  start(id: string) {
    return this.transition(id, ProgramStatus.IN_PROGRESS);
  }

  complete(id: string) {
    return this.transition(id, ProgramStatus.COMPLETED);
  }

  archive(id: string) {
    return this.transition(id, ProgramStatus.ARCHIVED);
  }

  async listOpen(query: ListProgramsQueryDto) {
    const now = new Date();
    const where: Prisma.ProgramWhereInput = {
      status: ProgramStatus.OPEN,
      applicationOpenDate: { lte: now },
      applicationCloseDate: { gte: now },
    };
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    return this.page(where, query.sortBy, query.order, query.page, query.limit);
  }

  async listForStaff(query: ListStaffProgramsQueryDto) {
    const where: Prisma.ProgramWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    return this.page(where, query.sortBy, query.order, query.page, query.limit);
  }

  async getOne(user: AuthUser, id: string) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw notFound();

    if (user.role === Role.INTERN && program.status !== ProgramStatus.OPEN) {
      const applied = await this.prisma.application.findUnique({
        where: { internId_programId: { internId: user.id, programId: id } },
        select: { id: true },
      });
      if (!applied) throw notFound();
    }

    return this.toResponse(program, await this.getAcceptedCount(id));
  }

  private async transition(id: string, to: ProgramStatus) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockProgram(tx, id);
      const program = await tx.program.findUniqueOrThrow({ where: { id } });

      if (!PROGRAM_TRANSITIONS[program.status].includes(to)) {
        throw new ConflictException({
          code: 'INVALID_TRANSITION',
          message: `A program that is ${program.status} can't be changed to ${to}.`,
        });
      }

      const updated = await tx.program.update({
        where: { id },
        data: { status: to },
      });
      return this.toResponse(updated, await this.getAcceptedCount(id, tx));
    });
  }

  private async page(
    where: Prisma.ProgramWhereInput,
    sortBy: string,
    order: 'asc' | 'desc',
    page: number,
    limit: number,
  ) {
    const orderBy = [
      { [sortBy]: order },
      { id: 'asc' },
    ] as Prisma.ProgramOrderByWithRelationInput[];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.program.count({ where }),
      this.prisma.program.findMany({
        where,
        orderBy,
        skip: skipOf(page, limit),
        take: limit,
      }),
    ]);

    const counts = await this.acceptedCounts(rows.map((r) => r.id));
    const data = rows.map((r) => this.toResponse(r, counts.get(r.id) ?? 0));
    return paginated(data, total, page, limit);
  }

  private async acceptedCounts(ids: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (ids.length === 0) return map;

    const rows = await this.prisma.application.groupBy({
      by: ['programId'],
      where: { programId: { in: ids }, status: ApplicationStatus.ACCEPTED },
      _count: { _all: true },
    });
    for (const r of rows) map.set(r.programId, r._count._all);
    return map;
  }

  private toResponse(program: Program, acceptedCount: number) {
    return {
      ...program,
      acceptedCount,
      seatsLeft: Math.max(0, program.capacity - acceptedCount),
    };
  }

  // Locks the program row so edits/transitions/acceptances can't race.
  private async lockProgram(tx: Prisma.TransactionClient, id: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Program" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (rows.length === 0) throw notFound();
  }
}