import { Injectable } from '@nestjs/common';
import { DocumentType, Permission, Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/types/auth-user';
import { StaffVisibilityService } from '../visibility/staff-visibility.service';

export interface AccessSubject {
  type: DocumentType;
  ownerId: string;
  internId: string | null;
}

@Injectable()
export class DocumentAccessService {
  constructor(private readonly visibility: StaffVisibilityService) {}

  async canAccess(user: AuthUser, doc: AccessSubject): Promise<boolean> {
    const isOwner = user.role === Role.INTERN && doc.ownerId === user.id;
    const isStaff = user.role === Role.STAFF;
    const has = (...needed: Permission[]) =>
      isStaff && needed.some((p) => user.permissions.includes(p));

    switch (doc.type) {
      case DocumentType.CV:
        return (
          isOwner ||
          has(Permission.CAN_REVIEW_APPLICATIONS, Permission.CAN_VIEW_ALL_INTERNS)
        );

      case DocumentType.INTERNSHIP_DOC:
        if (
          isOwner ||
          has(
            Permission.CAN_VIEW_ALL_INTERNS,
            Permission.CAN_CHANGE_INTERNSHIP_STATUS,
          )
        ) {
          return true;
        }
        if (isStaff && doc.internId) {
          return this.isCurrentMentor(user.id, doc.internId);
        }
        return false;

      case DocumentType.SUBMISSION:
        if (isOwner) return true;
        if (has(Permission.CAN_REVIEW_TASKS) && doc.internId) {
          return this.visibility.canViewIntern(user, doc.internId);
        }
        return false;

      default:
        return false;
    }
  }

  // Same rules as canAccess, expressed as a DB filter for the list endpoint.
  accessibleWhere(user: AuthUser): Prisma.DocumentWhereInput {
    if (user.role === Role.INTERN) return { ownerId: user.id };

    const has = (...needed: Permission[]) =>
      needed.some((p) => user.permissions.includes(p));
    const clauses: Prisma.DocumentWhereInput[] = [];

    if (has(Permission.CAN_REVIEW_APPLICATIONS, Permission.CAN_VIEW_ALL_INTERNS)) {
      clauses.push({ type: DocumentType.CV });
    }
    if (
      has(Permission.CAN_VIEW_ALL_INTERNS, Permission.CAN_CHANGE_INTERNSHIP_STATUS)
    ) {
      clauses.push({ type: DocumentType.INTERNSHIP_DOC });
    }

    // Internship documents of the interns this staff currently mentors.
    clauses.push({
      type: DocumentType.INTERNSHIP_DOC,
      intern: {
        internships: {
          some: {
            mentorAssignments: { some: { staffId: user.id, endedAt: null } },
          },
        },
      },
    });

    // Submissions: CAN_REVIEW_TASKS + (view all interns OR current mentor).
    if (has(Permission.CAN_REVIEW_TASKS)) {
      clauses.push(
        this.visibility.hasViewAll(user)
          ? { type: DocumentType.SUBMISSION }
          : {
              type: DocumentType.SUBMISSION,
              intern: {
                internships: {
                  some: {
                    mentorAssignments: {
                      some: { staffId: user.id, endedAt: null },
                    },
                  },
                },
              },
            },
      );
    }

    return { OR: clauses };
  }

  isCurrentMentor(staffId: string, internId: string): Promise<boolean> {
    return this.visibility.isCurrentMentor(staffId, internId);
  }
}