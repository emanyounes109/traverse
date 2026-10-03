import { Injectable } from '@nestjs/common';
import {
  InternshipStatus,
  Permission,
  Prisma,
  TaskStatus,
} from '@prisma/client';
import type { AuthUser } from '../common/types/auth-user';
import { InternsService } from '../internships/interns.service';
import { OPEN_INTERNSHIP_STATUSES } from '../internships/internships.constants';
import { InternshipsService } from '../internships/internships.service';
import { ACTIVE_INTERVIEW_STATUSES } from '../interviews/interviews.constants';
import { PrismaService } from '../prisma/prisma.service';
import { StaffVisibilityService } from '../visibility/staff-visibility.service';
import {
  APPLICATION_STATUSES,
  TASK_STATUSES,
  zeroCounts,
} from './dashboard.constants';

const LIST_SIZE = 5;
const PROGRESS_LIST_SIZE = 10;
const CLOSED_INTERNSHIP: InternshipStatus[] = [
  InternshipStatus.COMPLETED,
  InternshipStatus.DROPPED,
];

const STAFF_NAME_SELECT = {
  id: true,
  staffProfile: { select: { fullName: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: StaffVisibilityService,
    private readonly internships: InternshipsService,
    private readonly interns: InternsService,
  ) {}

  // ---------- intern dashboard ----------

  async intern(user: AuthUser) {
    const now = new Date();

    const internship = await this.prisma.internship.findFirst({
      where: { internId: user.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        status: true,
        startedAt: true,
        program: { select: { id: true, name: true } },
        mentorAssignments: {
          where: { endedAt: null },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          select: {
            staff: {
              select: {
                id: true,
                staffProfile: { select: { fullName: true, workEmail: true } },
              },
            },
          },
        },
      },
    });

    const [progress, taskCounts, deadlines, feedback, interview] =
      await Promise.all([
        internship ? this.internships.getProgress([internship.id]) : null,
        internship
          ? this.countTasks({ internshipId: internship.id })
          : zeroCounts(TASK_STATUSES),
        this.prisma.task.findMany({
          where: {
            internId: user.id,
            status: { not: TaskStatus.APPROVED },
            deadline: { gte: now },
          },
          orderBy: [{ deadline: 'asc' }, { id: 'asc' }],
          take: LIST_SIZE,
          select: {
            id: true,
            title: true,
            deadline: true,
            priority: true,
            status: true,
          },
        }),
        this.prisma.feedback.findMany({
          where: { task: { internId: user.id } },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: LIST_SIZE,
          select: {
            id: true,
            taskId: true,
            comment: true,
            createdAt: true,
            task: { select: { title: true } },
            staff: { select: STAFF_NAME_SELECT },
          },
        }),
        this.prisma.interview.findFirst({
          where: {
            status: { in: [...ACTIVE_INTERVIEW_STATUSES] },
            scheduledAt: { gte: now },
            application: { internId: user.id },
          },
          orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            interviewer: { select: STAFF_NAME_SELECT },
            application: {
              select: { program: { select: { id: true, name: true } } },
            },
          },
        }),
      ]);

    const mentor = internship?.mentorAssignments[0]?.staff;

    return {
      internship: internship
        ? {
            id: internship.id,
            status: internship.status,
            startedAt: internship.startedAt,
            program: internship.program,
          }
        : null,
      progressPercent: internship
        ? (progress?.get(internship.id)?.progress ?? 0)
        : 0,
      taskCounts,
      upcomingDeadlines: deadlines,
      recentFeedback: feedback.map((f) => ({
        id: f.id,
        taskId: f.taskId,
        taskTitle: f.task.title,
        comment: f.comment,
        staff: {
          id: f.staff.id,
          fullName: f.staff.staffProfile?.fullName ?? null,
        },
        createdAt: f.createdAt,
      })),
      currentMentor: mentor
        ? {
            id: mentor.id,
            fullName: mentor.staffProfile?.fullName ?? null,
            workEmail: mentor.staffProfile?.workEmail ?? null,
          }
        : null,
      nextInterview: interview
        ? {
            id: interview.id,
            scheduledAt: interview.scheduledAt,
            status: interview.status,
            interviewer: {
              id: interview.interviewer.id,
              fullName: interview.interviewer.staffProfile?.fullName ?? null,
            },
            program: interview.application.program,
          }
        : null,
    };
  }

  // ---------- staff dashboard ----------

  async staff(user: AuthUser) {
    const now = new Date();
    const scope = this.visibility.internScopeWhere(user);

    const has = (p: Permission) => user.permissions.includes(p);
    const canReviewApplications = has(Permission.CAN_REVIEW_APPLICATIONS);
    const canSeeInterviews =
      canReviewApplications || has(Permission.CAN_MANAGE_INTERVIEWS);
    const canSeeWorkload =
      has(Permission.CAN_ASSIGN_MENTOR) || has(Permission.CAN_VIEW_ALL_INTERNS);

    const [
      interns,
      applicationsByStatus,
      upcomingInterviews,
      mentorWorkload,
      tasks,
      internProgress,
      overdueTasks,
      unassignedInterns,
    ] = await Promise.all([
      this.internCounts(scope),
      canReviewApplications ? this.applicationCounts() : null,
      canSeeInterviews ? this.upcomingInterviews(now) : null,
      canSeeWorkload ? this.interns.workload(user) : null,
      this.taskSummary(scope),
      this.internProgress(scope),
      this.overdueTasks(scope, now),
      this.unassignedInterns(scope),
    ]);

    return {
      interns,
      applicationsByStatus,
      upcomingInterviews,
      mentorWorkload,
      tasks,
      internProgress,
      overdueTasks,
      unassignedInterns,
    };
  }

  private async internCounts(scope: Prisma.InternshipWhereInput) {
    const [byStatus, distinct] = await Promise.all([
      this.prisma.internship.groupBy({
        by: ['status'],
        where: scope,
        _count: { _all: true },
      }),
      this.prisma.internship.groupBy({
        by: ['internId'],
        where: scope,
        _count: { _all: true },
      }),
    ]);
    const count = (s: InternshipStatus) =>
      byStatus.find((r) => r.status === s)?._count._all ?? 0;

    return {
      total: distinct.length,
      active: count(InternshipStatus.ACTIVE),
      completed: count(InternshipStatus.COMPLETED),
    };
  }

  private async applicationCounts() {
    const rows = await this.prisma.application.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = zeroCounts(APPLICATION_STATUSES);
    for (const r of rows) counts[r.status] = r._count._all;
    return counts;
  }

  private async upcomingInterviews(now: Date) {
    const rows = await this.prisma.interview.findMany({
      where: {
        status: { in: [...ACTIVE_INTERVIEW_STATUSES] },
        scheduledAt: { gte: now },
      },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
      take: LIST_SIZE,
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        interviewer: { select: STAFF_NAME_SELECT },
        application: {
          select: {
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
    });

    return rows.map((r) => ({
      id: r.id,
      scheduledAt: r.scheduledAt,
      status: r.status,
      interviewer: {
        id: r.interviewer.id,
        fullName: r.interviewer.staffProfile?.fullName ?? null,
      },
      applicant: {
        id: r.application.intern.id,
        fullName: r.application.intern.internProfile?.fullName ?? null,
      },
      program: r.application.program,
    }));
  }

  private async taskSummary(scope: Prisma.InternshipWhereInput) {
    const byStatus = await this.countTasks({ internship: scope });
    const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
    const completionRate =
      total === 0
        ? 0
        : Math.round((byStatus[TaskStatus.APPROVED] / total) * 100);
    return { byStatus, total, completionRate };
  }

  private async internProgress(scope: Prisma.InternshipWhereInput) {
    const rows = await this.prisma.internship.findMany({
      where: {
        AND: [
          scope,
          {
            status: {
              in: [InternshipStatus.ONBOARDING, InternshipStatus.ACTIVE],
            },
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: PROGRESS_LIST_SIZE,
      select: {
        id: true,
        internId: true,
        status: true,
        intern: { select: { internProfile: { select: { fullName: true } } } },
      },
    });

    // One grouped query for the whole list.
    const progress = await this.internships.getProgress(rows.map((r) => r.id));
    return rows.map((r) => ({
      internId: r.internId,
      fullName: r.intern.internProfile?.fullName ?? null,
      internshipId: r.id,
      status: r.status,
      progressPercent: progress.get(r.id)?.progress ?? 0,
    }));
  }

  private overdueTasks(scope: Prisma.InternshipWhereInput, now: Date) {
    return this.prisma.task.count({
      where: {
        deadline: { lt: now },
        status: { not: TaskStatus.APPROVED },
        internship: { AND: [scope, { status: { notIn: CLOSED_INTERNSHIP } }] },
      },
    });
  }

  private unassignedInterns(scope: Prisma.InternshipWhereInput) {
    return this.prisma.internship.count({
      where: {
        AND: [
          scope,
          {
            status: { in: [...OPEN_INTERNSHIP_STATUSES] },
            mentorAssignments: { none: { endedAt: null } },
          },
        ],
      },
    });
  }

  private async countTasks(where: Prisma.TaskWhereInput) {
    const rows = await this.prisma.task.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });
    const counts = zeroCounts(TASK_STATUSES);
    for (const r of rows) counts[r.status] = r._count._all;
    return counts;
  }
}