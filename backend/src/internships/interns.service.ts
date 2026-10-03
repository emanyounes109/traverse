import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Permission, Prisma, Role, UserStatus } from '@prisma/client';
import { PageQueryDto } from '../common/pagination/page-query.dto';
import { paginated, skipOf } from '../common/pagination/pagination';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { StaffVisibilityService } from '../visibility/staff-visibility.service';
import { ListInternsQueryDto } from './dto/list-interns-query.dto';
import { badRequest, forbidden, notFound } from './internships.errors';
import {
  INTERNSHIP_DETAIL_SELECT,
  OPEN_INTERNSHIP_STATUSES,
  maxInternsPerMentor,
} from './internships.constants';
import { InternshipsService } from './internships.service';
import {
  emptyProgress,
  toInternListItem,
  toInternshipDetail,
} from './internships.mapper';

@Injectable()
export class InternsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: StaffVisibilityService,
    private readonly internships: InternshipsService,
    private readonly config: ConfigService,
  ) {}

  async list(user: AuthUser, query: ListInternsQueryDto) {
    const { progressMin, progressMax } = query;
    if (
      progressMin !== undefined &&
      progressMax !== undefined &&
      progressMin > progressMax
    ) {
      throw badRequest(
        'INVALID_PROGRESS_RANGE',
        'progressMin must not be greater than progressMax.',
      );
    }

    const and: Prisma.InternshipWhereInput[] = [
      this.visibility.internScopeWhere(user),
    ];
    if (query.status) and.push({ status: query.status });
    if (query.program) and.push({ programId: query.program });
    if (query.mentor) {
      and.push({
        mentorAssignments: { some: { staffId: query.mentor, endedAt: null } },
      });
    }
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
    const where: Prisma.InternshipWhereInput = { AND: and };

    const needsProgress =
      query.sortBy === 'progress' ||
      progressMin !== undefined ||
      progressMax !== undefined;

    return needsProgress
      ? this.listByProgress(where, query)
      : this.listByDb(where, query);
  }

  async getOne(user: AuthUser, internId: string) {
    const intern = await this.prisma.user.findFirst({
      where: { id: internId, role: Role.INTERN },
      select: {
        id: true,
        email: true,
        internProfile: {
          select: { fullName: true, phone: true, contactInfo: true, cvDocumentId: true },
        },
      },
    });
    if (!intern) throw notFound('Intern not found.');
    if (!(await this.visibility.canViewIntern(user, internId))) throw forbidden();

    const rows = await this.prisma.internship.findMany({
      where: { internId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: INTERNSHIP_DETAIL_SELECT,
    });
    const progress = await this.internships.getProgress(rows.map((r) => r.id));
    const internships = rows.map((r) =>
      toInternshipDetail(r, progress.get(r.id) ?? emptyProgress()),
    );
    const latest = internships[0];

    return {
      profile: {
        id: intern.id,
        fullName: intern.internProfile?.fullName ?? null,
        email: intern.email,
        phone: intern.internProfile?.phone ?? null,
        contactInfo: intern.internProfile?.contactInfo ?? null,
        cvDocumentId: intern.internProfile?.cvDocumentId ?? null,
      },
      internships,
      currentMentor: internships.find((i) => i.mentor)?.mentor ?? null,
      progress: latest?.progress ?? 0,
      taskCounts: latest?.taskCounts ?? { total: 0, approved: 0 },
    };
  }

  async mentorHistory(user: AuthUser, internId: string) {
    const intern = await this.prisma.user.findFirst({
      where: { id: internId, role: Role.INTERN },
      select: { id: true },
    });
    if (!intern) throw notFound('Intern not found.');
    if (!(await this.visibility.canAccessIntern(user, internId))) {
      throw forbidden();
    }

    const rows = await this.prisma.mentorAssignment.findMany({
      where: { internship: { internId } },
      orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        internshipId: true,
        assignedAt: true,
        endedAt: true,
        staff: {
          select: { id: true, staffProfile: { select: { fullName: true } } },
        },
        assignedBy: {
          select: { id: true, staffProfile: { select: { fullName: true } } },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      internshipId: r.internshipId,
      mentor: { id: r.staff.id, fullName: r.staff.staffProfile?.fullName ?? null },
      assignedBy: {
        id: r.assignedBy.id,
        fullName: r.assignedBy.staffProfile?.fullName ?? null,
      },
      assignedAt: r.assignedAt,
      endedAt: r.endedAt,
    }));
  }

  async workload(user: AuthUser) {
    const allowed =
      user.role === Role.STAFF &&
      (user.permissions.includes(Permission.CAN_ASSIGN_MENTOR) ||
        user.permissions.includes(Permission.CAN_VIEW_ALL_INTERNS));
    if (!allowed) throw forbidden();

    const [staff, counts] = await Promise.all([
      this.prisma.staffProfile.findMany({
        where: { user: { role: Role.STAFF, status: UserStatus.ACTIVE } },
        orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
        select: { userId: true, fullName: true, workEmail: true },
      }),
      this.prisma.mentorAssignment.groupBy({
        by: ['staffId'],
        where: {
          endedAt: null,
          internship: { status: { in: [...OPEN_INTERNSHIP_STATUSES] } },
        },
        _count: { _all: true },
      }),
    ]);

    const byStaff = new Map(counts.map((c) => [c.staffId, c._count._all]));
    const maxInterns = maxInternsPerMentor(this.config);

    return staff.map((s) => {
      const activeInternCount = byStaff.get(s.userId) ?? 0;
      return {
        id: s.userId,
        fullName: s.fullName,
        workEmail: s.workEmail,
        activeInternCount,
        maxInterns,
        atCapacity: activeInternCount >= maxInterns,
      };
    });
  }

  async listForMentor(user: AuthUser, staffId: string, query: PageQueryDto) {
    if (!this.visibility.hasViewAll(user) && user.id !== staffId) {
      throw forbidden();
    }
    const staff = await this.prisma.user.findFirst({
      where: { id: staffId, role: Role.STAFF },
      select: { id: true },
    });
    if (!staff) throw notFound('Staff member not found.');

    const where: Prisma.InternshipWhereInput = {
      status: { in: [...OPEN_INTERNSHIP_STATUSES] },
      mentorAssignments: { some: { staffId, endedAt: null } },
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.internship.count({ where }),
      this.prisma.internship.findMany({
        where,
        orderBy: [
          { intern: { internProfile: { fullName: 'asc' } } },
          { id: 'asc' },
        ],
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: INTERNSHIP_DETAIL_SELECT,
      }),
    ]);

    const progress = await this.internships.getProgress(rows.map((r) => r.id));
    const data = rows.map((r) =>
      toInternListItem(r, progress.get(r.id) ?? emptyProgress()),
    );
    return paginated(data, total, query.page, query.limit);
  }

  private async listByDb(where: Prisma.InternshipWhereInput, query: ListInternsQueryDto) {
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.internship.count({ where }),
      this.prisma.internship.findMany({
        where,
        orderBy: this.orderBy(query.sortBy, query.order),
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: INTERNSHIP_DETAIL_SELECT,
      }),
    ]);

    // One grouped query for the whole page (no N+1).
    const progress = await this.internships.getProgress(rows.map((r) => r.id));
    const data = rows.map((r) =>
      toInternListItem(r, progress.get(r.id) ?? emptyProgress()),
    );
    return paginated(data, total, query.page, query.limit);
  }

  // Progress filters / sorting need the progress of every match, so it is
  // computed with one grouped query, then filtered, sorted and paged here.
  private async listByProgress(
    where: Prisma.InternshipWhereInput,
    query: ListInternsQueryDto,
  ) {
    const rows = await this.prisma.internship.findMany({
      where,
      select: INTERNSHIP_DETAIL_SELECT,
    });
    const progress = await this.internships.getProgress(rows.map((r) => r.id));

    let items = rows.map((row) => ({
      row,
      info: progress.get(row.id) ?? emptyProgress(),
    }));

    const min = query.progressMin;
    const max = query.progressMax;
    if (min !== undefined) items = items.filter((i) => i.info.progress >= min);
    if (max !== undefined) items = items.filter((i) => i.info.progress <= max);

    const dir = query.order === 'asc' ? 1 : -1;
    const keyOf = (i: (typeof items)[number]): string | number | null => {
      switch (query.sortBy) {
        case 'progress':
          return i.info.progress;
        case 'fullName':
          return (i.row.intern.internProfile?.fullName ?? '').toLowerCase();
        case 'status':
          return i.row.status;
        case 'startedAt':
          return i.row.startedAt ? i.row.startedAt.getTime() : null;
        default:
          return i.row.createdAt.getTime();
      }
    };

    items.sort((x, y) => {
      const a = keyOf(x);
      const b = keyOf(y);
      if (a === null && b !== null) return 1;
      if (b === null && a !== null) return -1;
      if (a !== null && b !== null && a !== b) return (a < b ? -1 : 1) * dir;
      return x.row.id.localeCompare(y.row.id);
    });

    const start = skipOf(query.page, query.limit);
    const pageItems = items.slice(start, start + query.limit);
    return paginated(
      pageItems.map((i) => toInternListItem(i.row, i.info)),
      items.length,
      query.page,
      query.limit,
    );
  }

  private orderBy(
    sortBy: string,
    order: 'asc' | 'desc',
  ): Prisma.InternshipOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'fullName':
        return [{ intern: { internProfile: { fullName: order } } }, { id: 'asc' }];
      case 'status':
        return [{ status: order }, { id: 'asc' }];
      case 'startedAt':
        return [{ startedAt: { sort: order, nulls: 'last' } }, { id: 'asc' }];
      default:
        return [{ createdAt: order }, { id: 'asc' }];
    }
  }
}