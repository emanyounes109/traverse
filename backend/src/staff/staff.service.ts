import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Permission, Prisma, Role, UserStatus } from '@prisma/client';
import { PageQueryDto } from '../common/pagination/page-query.dto';
import { paginated, skipOf } from '../common/pagination/pagination';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { ListStaffQueryDto } from './dto/list-staff-query.dto';
import {
  PERMISSION_ORDER,
  USER_STATUS_TRANSITIONS,
  USERS_ADVISORY_LOCK,
} from './staff.constants';

type Tx = Prisma.TransactionClient;

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(actor: AuthUser, query: ListStaffQueryDto) {
    const canManage = actor.permissions.includes(Permission.CAN_MANAGE_USERS);
    if (query.status !== undefined && !canManage) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: "You don't have permission to do that.",
      });
    }

    const where: Prisma.StaffProfileWhereInput = {
      user: { role: Role.STAFF, status: query.status ?? UserStatus.ACTIVE },
    };
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { workEmail: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.StaffProfileOrderByWithRelationInput[] = [
      query.sortBy === 'createdAt'
        ? { createdAt: query.order }
        : { fullName: query.order },
      { id: 'asc' },
    ];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.staffProfile.count({ where }),
      this.prisma.staffProfile.findMany({
        where,
        orderBy,
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: {
          userId: true,
          fullName: true,
          workEmail: true,
          permissions: true,
          user: { select: { status: true } },
        },
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.userId,
      fullName: r.fullName,
      workEmail: r.workEmail,
      ...(canManage
        ? { status: r.user.status, permissions: r.permissions }
        : {}),
    }));

    return paginated(data, total, query.page, query.limit);
  }

  async listPending(query: PageQueryDto) {
    const where: Prisma.StaffProfileWhereInput = {
      user: { role: Role.STAFF, status: UserStatus.PENDING_APPROVAL },
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.staffProfile.count({ where }),
      this.prisma.staffProfile.findMany({
        where,
        orderBy: [{ user: { createdAt: 'asc' } }, { id: 'asc' }],
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: {
          userId: true,
          fullName: true,
          workEmail: true,
          user: { select: { email: true, createdAt: true } },
        },
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.userId,
      email: r.user.email,
      fullName: r.fullName,
      workEmail: r.workEmail,
      createdAt: r.user.createdAt,
    }));

    return paginated(data, total, query.page, query.limit);
  }

  async approve(actorId: string, targetId: string, permissions: Permission[]) {
    const next = this.normalize(permissions);

    const { target, profile } = await this.prisma.$transaction(async (tx) => {
      const target = await this.findStaffTarget(tx, targetId);
      this.assertTransition(target.status, UserStatus.ACTIVE);

      const moved = await tx.user.updateMany({
        where: { id: targetId, status: target.status },
        data: { status: UserStatus.ACTIVE },
      });
      if (moved.count === 0) {
        throw this.invalidTransition(target.status, UserStatus.ACTIVE);
      }

      const profile = await tx.staffProfile.update({
        where: { userId: targetId },
        data: { permissions: next },
        select: { fullName: true, workEmail: true, permissions: true },
      });
      return { target, profile };
    });

    this.logChange('staff.approve', actorId, targetId, {
      oldStatus: target.status,
      newStatus: UserStatus.ACTIVE,
      oldPermissions: target.profile.permissions,
      newPermissions: profile.permissions,
    });

    return {
      id: targetId,
      fullName: profile.fullName,
      workEmail: profile.workEmail,
      status: UserStatus.ACTIVE,
      permissions: profile.permissions,
    };
  }

  async reject(actorId: string, targetId: string) {
    const target = await this.prisma.$transaction(async (tx) => {
      const target = await this.findStaffTarget(tx, targetId);
      this.assertTransition(target.status, UserStatus.DISABLED);

      const moved = await tx.user.updateMany({
        where: { id: targetId, status: target.status },
        data: { status: UserStatus.DISABLED },
      });
      if (moved.count === 0) {
        throw this.invalidTransition(target.status, UserStatus.DISABLED);
      }
      return target;
    });

    this.logChange('staff.reject', actorId, targetId, {
      oldStatus: target.status,
      newStatus: UserStatus.DISABLED,
    });

    return { id: targetId, status: UserStatus.DISABLED };
  }

  async setPermissions(
    actorId: string,
    targetId: string,
    permissions: Permission[],
  ) {
    const next = this.normalize(permissions);

    const { target, profile } = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${USERS_ADVISORY_LOCK}))`;

      const target = await this.findStaffTarget(tx, targetId);
      if (target.status !== UserStatus.ACTIVE) {
        throw new ConflictException({
          code: 'INVALID_STATE',
          message: 'Permissions can only be changed for active staff.',
        });
      }

      const hadManage = target.profile.permissions.includes(
        Permission.CAN_MANAGE_USERS,
      );
      const keepsManage = next.includes(Permission.CAN_MANAGE_USERS);

      if (hadManage && !keepsManage) {
        const otherHolders = await tx.staffProfile.count({
          where: {
            userId: { not: targetId },
            permissions: { has: Permission.CAN_MANAGE_USERS },
            user: { role: Role.STAFF, status: UserStatus.ACTIVE },
          },
        });
        if (otherHolders === 0) {
          throw new ConflictException({
            code: 'LAST_USER_MANAGER',
            message:
              'At least one active staff member must keep the permission to manage users.',
          });
        }
      }

      const profile = await tx.staffProfile.update({
        where: { userId: targetId },
        data: { permissions: next },
        select: { fullName: true, workEmail: true, permissions: true },
      });
      return { target, profile };
    });

    this.logChange('staff.permissions', actorId, targetId, {
      oldPermissions: target.profile.permissions,
      newPermissions: profile.permissions,
    });

    return {
      id: targetId,
      fullName: profile.fullName,
      workEmail: profile.workEmail,
      status: target.status,
      permissions: profile.permissions,
    };
  }

  private async findStaffTarget(tx: Tx, id: string) {
    const user = await tx.user.findFirst({
      where: { id, role: Role.STAFF, staffProfile: { isNot: null } },
      select: {
        id: true,
        status: true,
        staffProfile: {
          select: { fullName: true, workEmail: true, permissions: true },
        },
      },
    });
    if (!user || !user.staffProfile) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Staff member not found.',
      });
    }
    return { id: user.id, status: user.status, profile: user.staffProfile };
  }

  private assertTransition(from: UserStatus, to: UserStatus) {
    if (!USER_STATUS_TRANSITIONS[from].includes(to)) {
      throw this.invalidTransition(from, to);
    }
  }

  private invalidTransition(from: UserStatus, to: UserStatus) {
    return new ConflictException({
      code: 'INVALID_TRANSITION',
      message: `Changing the status from ${from} to ${to} is not allowed.`,
    });
  }

  private normalize(permissions: Permission[]): Permission[] {
    return PERMISSION_ORDER.filter((p) => permissions.includes(p));
  }

  private logChange(
    action: string,
    actorId: string,
    targetId: string,
    change: Record<string, unknown>,
  ) {
    this.logger.log(JSON.stringify({ action, actorId, targetId, ...change }));
  }
}