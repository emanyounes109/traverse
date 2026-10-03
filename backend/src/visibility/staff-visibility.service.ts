import { Injectable } from '@nestjs/common';
import { Permission, Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffVisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  hasViewAll(user: AuthUser): boolean {
    return (
      user.role === Role.STAFF &&
      user.permissions.includes(Permission.CAN_VIEW_ALL_INTERNS)
    );
  }

  async isCurrentMentor(staffId: string, internId: string): Promise<boolean> {
    const count = await this.prisma.mentorAssignment.count({
      where: { staffId, endedAt: null, internship: { internId } },
    });
    return count > 0;
  }

  async canViewIntern(user: AuthUser, internId: string): Promise<boolean> {
    if (user.role !== Role.STAFF) return false;
    if (this.hasViewAll(user)) return true;
    return this.isCurrentMentor(user.id, internId);
  }

  // The intern themself, or staff who can view that intern.
  async canAccessIntern(user: AuthUser, internId: string): Promise<boolean> {
    if (user.role === Role.INTERN) return user.id === internId;
    return this.canViewIntern(user, internId);
  }

  internScopeWhere(user: AuthUser): Prisma.InternshipWhereInput {
    if (user.role !== Role.STAFF) return { id: { in: [] } };
    if (this.hasViewAll(user)) return {};
    return { mentorAssignments: { some: { staffId: user.id, endedAt: null } } };
  }

  // null means "all interns".
  async scopedInternIds(user: AuthUser): Promise<string[] | null> {
    if (this.hasViewAll(user)) return null;
    const rows = await this.prisma.internship.findMany({
      where: this.internScopeWhere(user),
      select: { internId: true },
      distinct: ['internId'],
    });
    return rows.map((r) => r.internId);
  }
}