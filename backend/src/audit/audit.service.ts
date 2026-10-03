import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Permission, Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { StaffVisibilityService } from '../visibility/staff-visibility.service';
import { AUDIT_ENTITY_TYPES, AuditEntityType } from './audit.constants';

const USER_NAME_SELECT = {
  id: true,
  staffProfile: { select: { fullName: true } },
  internProfile: { select: { fullName: true } },
} satisfies Prisma.UserSelect;

type NamedUser = Prisma.UserGetPayload<{ select: typeof USER_NAME_SELECT }>;

const actor = (u: NamedUser) => ({
  id: u.id,
  fullName: u.staffProfile?.fullName ?? u.internProfile?.fullName ?? null,
});

interface AccessRule {
  anyOf?: readonly Permission[];
  scoped: boolean;
}

const notFound = () =>
  new NotFoundException({ code: 'NOT_FOUND', message: 'Record not found.' });

const forbidden = () =>
  new ForbiddenException({
    code: 'FORBIDDEN',
    message: "You don't have permission to do that.",
  });

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: StaffVisibilityService,
  ) {}

  async get(user: AuthUser, rawType: string, id: string) {
    const entityType = this.parseType(rawType);
    const isStaff = user.role === Role.STAFF;
    let entries: unknown[];

    switch (entityType) {
      case 'application': {
        const app = await this.prisma.application.findUnique({
          where: { id },
          select: { internId: true },
        });
        if (!app) throw notFound();
        await this.assertAccess(user, app.internId, {
          anyOf: [Permission.CAN_REVIEW_APPLICATIONS],
          scoped: false,
        });
        entries = await this.applicationEntries(id, isStaff);
        break;
      }
      case 'interview': {
        const interview = await this.prisma.interview.findUnique({
          where: { id },
          select: { application: { select: { internId: true } } },
        });
        if (!interview) throw notFound();
        await this.assertAccess(user, interview.application.internId, {
          anyOf: [
            Permission.CAN_REVIEW_APPLICATIONS,
            Permission.CAN_MANAGE_INTERVIEWS,
          ],
          scoped: false,
        });
        entries = await this.interviewEntries(id, isStaff);
        break;
      }
      case 'internship':
      case 'mentor-assignments': {
        const internship = await this.prisma.internship.findUnique({
          where: { id },
          select: { internId: true },
        });
        if (!internship) throw notFound();
        await this.assertAccess(user, internship.internId, { scoped: true });
        entries =
          entityType === 'internship'
            ? await this.internshipEntries(id)
            : await this.mentorEntries(id);
        break;
      }
      default: {
        const task = await this.prisma.task.findUnique({
          where: { id },
          select: { internId: true },
        });
        if (!task) throw notFound();
        await this.assertAccess(user, task.internId, { scoped: true });
        entries = await this.taskEntries(id);
      }
    }

    return { entityType, entityId: id, entries };
  }

  private parseType(raw: string): AuditEntityType {
    if (!(AUDIT_ENTITY_TYPES as readonly string[]).includes(raw)) {
      throw new BadRequestException({
        code: 'INVALID_ENTITY_TYPE',
        message: `entityType must be one of: ${AUDIT_ENTITY_TYPES.join(', ')}.`,
      });
    }
    return raw as AuditEntityType;
  }

  private async assertAccess(
    user: AuthUser,
    ownerInternId: string,
    rule: AccessRule,
  ) {
    if (user.role === Role.INTERN) {
      if (ownerInternId !== user.id) throw forbidden();
      return;
    }

    const has = (p: Permission) => user.permissions.includes(p);
    if (!has(Permission.CAN_VIEW_AUDIT)) throw forbidden();
    if (rule.anyOf && !rule.anyOf.some(has)) throw forbidden();
    if (
      rule.scoped &&
      !(await this.visibility.canViewIntern(user, ownerInternId))
    ) {
      throw forbidden();
    }
  }

  private async applicationEntries(id: string, showNotes: boolean) {
    const rows = await this.prisma.applicationStatusHistory.findMany({
      where: { applicationId: id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        note: true,
        createdAt: true,
        changedBy: { select: USER_NAME_SELECT },
      },
    });
    return rows.map(({ changedBy, note, ...r }) => ({
      ...r,
      ...(showNotes ? { note } : {}),
      changedBy: actor(changedBy),
    }));
  }

  private async interviewEntries(id: string, showNotes: boolean) {
    const rows = await this.prisma.interviewHistory.findMany({
      where: { interviewId: id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        action: true,
        oldScheduledAt: true,
        newScheduledAt: true,
        oldInterviewerId: true,
        newInterviewerId: true,
        oldStatus: true,
        newStatus: true,
        note: true,
        createdAt: true,
        changedBy: { select: USER_NAME_SELECT },
      },
    });
    return rows.map(({ changedBy, note, ...r }) => ({
      ...r,
      ...(showNotes ? { note } : {}),
      changedBy: actor(changedBy),
    }));
  }

  private async internshipEntries(id: string) {
    const rows = await this.prisma.internshipStatusHistory.findMany({
      where: { internshipId: id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        note: true,
        createdAt: true,
        changedBy: { select: USER_NAME_SELECT },
      },
    });
    return rows.map(({ changedBy, ...r }) => ({
      ...r,
      changedBy: actor(changedBy),
    }));
  }

  private async taskEntries(id: string) {
    const rows = await this.prisma.taskHistory.findMany({
      where: { taskId: id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        action: true,
        fromStatus: true,
        toStatus: true,
        note: true,
        createdAt: true,
        changedBy: { select: USER_NAME_SELECT },
      },
    });
    return rows.map(({ changedBy, ...r }) => ({
      ...r,
      changedBy: actor(changedBy),
    }));
  }

  private async mentorEntries(internshipId: string) {
    const rows = await this.prisma.mentorAssignment.findMany({
      where: { internshipId },
      orderBy: [{ assignedAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        assignedAt: true,
        endedAt: true,
        staff: { select: USER_NAME_SELECT },
        assignedBy: { select: USER_NAME_SELECT },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      mentor: actor(r.staff),
      assignedBy: actor(r.assignedBy),
      assignedAt: r.assignedAt,
      endedAt: r.endedAt,
    }));
  }
}