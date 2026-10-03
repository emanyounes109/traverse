import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  InternshipStatus,
  Prisma,
  Role,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { DocumentsService } from '../documents/documents.service';
import { paginated, skipOf } from '../common/pagination/pagination';
import type { AuthUser } from '../common/types/auth-user';
import { validationError } from '../common/utils/errors';
import {
  AppEvents,
  TaskAssignedEvent,
  TaskFeedbackGivenEvent,
  TaskReviewedEvent,
} from '../events/app-events';
import { DATE_ONLY } from '../applications/applications.constants';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../internships/internships.errors';
import { PrismaService } from '../prisma/prisma.service';
import { StaffVisibilityService } from '../visibility/staff-visibility.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListMyTasksQueryDto, ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { ReviewTaskDto } from './dto/review-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  CLOSED_INTERNSHIP_STATUSES,
  ReviewDecision,
  SUBMISSION_SELECT,
  TASK_DETAIL_SELECT,
  TASK_LIST_SELECT,
  TASK_SELECT,
  TASK_TRANSITIONS,
} from './tasks.constants';
import {
  toTaskDetail,
  toTaskListItem,
  toTaskResponse,
} from './tasks.mapper';

type Tx = Prisma.TransactionClient;

const taskNotFound = () => notFound('Task not found.');
const clip = (text: string) => (text.length > 60 ? `${text.slice(0, 57)}...` : text);

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: StaffVisibilityService,
    private readonly documents: DocumentsService,
    private readonly events: EventEmitter2,
  ) {}

  // ---------- staff: create / edit ----------

  async create(user: AuthUser, dto: CreateTaskDto) {
    const deadline = this.futureDeadline(dto.deadline);

    const found = await this.prisma.internship.findUnique({
      where: { id: dto.internshipId },
      select: { internId: true },
    });
    if (!found) throw notFound('Internship not found.');
    if (!(await this.visibility.canViewIntern(user, found.internId))) {
      throw forbidden();
    }

    const task = await this.prisma.$transaction(async (tx) => {
      await this.lockInternship(tx, dto.internshipId);
      const internship = await tx.internship.findUniqueOrThrow({
        where: { id: dto.internshipId },
        select: { internId: true, status: true },
      });
      if (internship.status !== InternshipStatus.ACTIVE) {
        throw conflict(
          'INTERNSHIP_NOT_ACTIVE',
          'Tasks can only be assigned for an active internship.',
        );
      }

      const created = await tx.task.create({
        data: {
          internshipId: dto.internshipId,
          internId: internship.internId,
          createdById: user.id,
          title: dto.title,
          description: dto.description,
          deadline,
          priority: dto.priority ?? TaskPriority.MEDIUM,
          status: TaskStatus.PENDING,
        },
        select: TASK_SELECT,
      });
      await tx.taskHistory.create({
        data: {
          taskId: created.id,
          action: 'CREATED',
          toStatus: TaskStatus.PENDING,
          changedById: user.id,
        },
      });
      return created;
    });

    const payload: TaskAssignedEvent = {
      taskId: task.id,
      internshipId: task.internshipId,
      internId: task.internId,
      title: task.title,
      deadline: task.deadline,
      occurredAt: new Date(),
    };
    this.emit(AppEvents.TASK_ASSIGNED, payload);
    return toTaskResponse(task);
  }

  async update(user: AuthUser, id: string, dto: UpdateTaskDto) {
    const hasAny = Object.values(dto).some((v) => v !== undefined);
    if (!hasAny) throw validationError(['at least one field must be provided']);
    const newDeadline =
      dto.deadline !== undefined ? this.futureDeadline(dto.deadline) : undefined;

    const found = await this.taskOwner(id);
    if (!(await this.visibility.canViewIntern(user, found.internId))) {
      throw forbidden();
    }

    return this.prisma.$transaction(async (tx) => {
      await this.lockTask(tx, id);
      const current = await tx.task.findUniqueOrThrow({
        where: { id },
        select: TASK_SELECT,
      });
      if (current.status === TaskStatus.APPROVED) {
        throw conflict('TASK_LOCKED', 'Approved tasks can no longer be edited.');
      }

      const data: Prisma.TaskUncheckedUpdateInput = {};
      const changes: string[] = [];

      if (dto.title !== undefined && dto.title !== current.title) {
        data.title = dto.title;
        changes.push(`title: "${clip(current.title)}" -> "${clip(dto.title)}"`);
      }
      if (
        dto.description !== undefined &&
        dto.description !== current.description
      ) {
        data.description = dto.description;
        changes.push('description changed');
      }
      if (newDeadline && newDeadline.getTime() !== current.deadline.getTime()) {
        data.deadline = newDeadline;
        changes.push(
          `deadline: ${current.deadline.toISOString()} -> ${newDeadline.toISOString()}`,
        );
      }
      if (dto.priority !== undefined && dto.priority !== current.priority) {
        data.priority = dto.priority;
        changes.push(`priority: ${current.priority} -> ${dto.priority}`);
      }

      if (changes.length === 0) return toTaskResponse(current);

      const updated = await tx.task.update({
        where: { id },
        data,
        select: TASK_SELECT,
      });
      await tx.taskHistory.create({
        data: {
          taskId: id,
          action: 'UPDATED',
          note: changes.join('; '),
          changedById: user.id,
        },
      });
      return toTaskResponse(updated);
    });
  }

  // ---------- reading ----------

  async list(user: AuthUser, query: ListTasksQueryDto) {
    const now = new Date();
    const and = this.commonFilters(query, now);

    const scope = this.visibility.internScopeWhere(user);
    if (Object.keys(scope).length > 0) and.push({ internship: scope });
    if (query.internId) and.push({ internId: query.internId });
    if (query.search) {
      and.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          {
            intern: {
              internProfile: {
                fullName: { contains: query.search, mode: 'insensitive' },
              },
            },
          },
        ],
      });
    }
    return this.page({ AND: and }, query, now);
  }

  async listMine(user: AuthUser, query: ListMyTasksQueryDto) {
    const now = new Date();
    const and = this.commonFilters(query, now);
    and.push({ internId: user.id });
    if (query.search) {
      and.push({ title: { contains: query.search, mode: 'insensitive' } });
    }
    return this.page({ AND: and }, query, now);
  }

  async getOne(user: AuthUser, id: string) {
    const row = await this.prisma.task.findUnique({
      where: { id },
      select: TASK_DETAIL_SELECT,
    });
    if (!row) throw taskNotFound();
    await this.assertCanView(user, row.internId);
    return toTaskDetail(row);
  }

  async listSubmissions(user: AuthUser, id: string) {
    const task = await this.taskOwner(id);
    await this.assertCanView(user, task.internId);

    return this.prisma.submission.findMany({
      where: { taskId: id },
      orderBy: [{ version: 'desc' }],
      select: SUBMISSION_SELECT,
    });
  }

  async history(user: AuthUser, id: string) {
    const task = await this.taskOwner(id);
    await this.assertCanView(user, task.internId);

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
      action: r.action,
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

  // ---------- intern actions ----------

  async start(user: AuthUser, id: string) {
    const task = await this.taskOwner(id);
    if (task.internId !== user.id) throw forbidden();

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await this.loadLocked(tx, id);
      this.assertInternshipOpen(current.internship.status);
      this.assertTransition(current.status, TaskStatus.IN_PROGRESS);
      return this.applyTransition(
        tx,
        current,
        TaskStatus.IN_PROGRESS,
        'STARTED',
        user.id,
      );
    });
    return toTaskResponse(updated);
  }

  async submit(
    user: AuthUser,
    id: string,
    dto: SubmitTaskDto,
    file: Express.Multer.File | undefined,
  ) {
    const owner = await this.taskOwner(id);
    if (owner.internId !== user.id) throw forbidden();
    const note = dto.note?.length ? dto.note : null;

    return this.prisma.$transaction(async (tx) => {
      const task = await this.loadLocked(tx, id);
      this.assertInternshipOpen(task.internship.status);

      const replacing = task.status === TaskStatus.SUBMITTED;
      if (task.status !== TaskStatus.IN_PROGRESS && !replacing) {
        throw conflict(
          'SUBMISSION_NOT_ALLOWED',
          task.status === TaskStatus.CHANGES_REQUESTED
            ? 'Start the task again before submitting.'
            : `A task that is ${task.status} can't accept a submission.`,
        );
      }

      const latest = await tx.submission.findFirst({
        where: { taskId: id },
        orderBy: [{ version: 'desc' }],
        select: { version: true, document: { select: { groupId: true } } },
      });

      const document = await this.documents.createSubmissionDocument(tx, {
        file,
        internId: task.internId,
        uploadedById: user.id,
        groupId: latest?.document.groupId,
      });

      const version = (latest?.version ?? 0) + 1;
      const isLate = Date.now() > task.deadline.getTime();

      const submission = await tx.submission.create({
        data: { taskId: id, documentId: document.id, note, version, isLate },
        select: SUBMISSION_SELECT,
      });

      if (replacing) {
        await tx.taskHistory.create({
          data: {
            taskId: id,
            action: 'FILE_REPLACED',
            fromStatus: TaskStatus.SUBMITTED,
            toStatus: TaskStatus.SUBMITTED,
            note: `Replaced the file with version ${version}${isLate ? ' (late)' : ''}`,
            changedById: user.id,
          },
        });
      } else {
        await this.applyTransition(
          tx,
          task,
          TaskStatus.SUBMITTED,
          'SUBMITTED',
          user.id,
          `Version ${version}${isLate ? ' (late)' : ''}`,
        );
      }
      return submission;
    });
  }

  // ---------- staff review ----------

  async startReview(user: AuthUser, id: string) {
    const owner = await this.taskOwner(id);
    if (!(await this.visibility.canViewIntern(user, owner.internId))) {
      throw forbidden();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await this.loadLocked(tx, id);
      this.assertTransition(current.status, TaskStatus.UNDER_REVIEW);
      return this.applyTransition(
        tx,
        current,
        TaskStatus.UNDER_REVIEW,
        'REVIEW_STARTED',
        user.id,
      );
    });
    return toTaskResponse(updated);
  }

  async review(user: AuthUser, id: string, dto: ReviewTaskDto) {
    const feedback = dto.feedback?.length ? dto.feedback : null;
    if (dto.decision === ReviewDecision.REQUEST_CHANGES && !feedback) {
      throw badRequest(
        'FEEDBACK_REQUIRED',
        'Please explain what needs to change.',
      );
    }

    const owner = await this.taskOwner(id);
    if (!(await this.visibility.canViewIntern(user, owner.internId))) {
      throw forbidden();
    }

    const approve = dto.decision === ReviewDecision.APPROVE;
    const target = approve ? TaskStatus.APPROVED : TaskStatus.CHANGES_REQUESTED;

    const { updated, feedbackId } = await this.prisma.$transaction(async (tx) => {
      const current = await this.loadLocked(tx, id);
      this.assertTransition(current.status, target);

      const latest = await tx.submission.findFirst({
        where: { taskId: id },
        orderBy: [{ version: 'desc' }],
        select: { id: true },
      });
      if (!latest) {
        throw conflict('NO_SUBMISSION', 'This task has no submission to review.');
      }

      let feedbackId: string | null = null;
      if (feedback) {
        const created = await tx.feedback.create({
          data: {
            taskId: id,
            submissionId: latest.id,
            staffId: user.id,
            comment: feedback,
          },
          select: { id: true },
        });
        feedbackId = created.id;
      }

      const updated = await this.applyTransition(
        tx,
        current,
        target,
        approve ? 'APPROVED' : 'CHANGES_REQUESTED',
        user.id,
        feedback,
      );
      return { updated, feedbackId };
    });

    const reviewed: TaskReviewedEvent = {
      taskId: updated.id,
      internId: updated.internId,
      internshipId: updated.internshipId,
      decision: dto.decision,
      status: updated.status,
      occurredAt: new Date(),
    };
    this.emit(AppEvents.TASK_REVIEWED, reviewed);

    if (feedbackId) {
      const given: TaskFeedbackGivenEvent = {
        taskId: updated.id,
        internId: updated.internId,
        feedbackId,
        occurredAt: new Date(),
      };
      this.emit(AppEvents.TASK_FEEDBACK_GIVEN, given);
    }
    return toTaskResponse(updated);
  }

  // ---------- helpers ----------

  private async taskOwner(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true, internId: true },
    });
    if (!task) throw taskNotFound();
    return task;
  }

  private async assertCanView(user: AuthUser, internId: string) {
    if (user.role === Role.INTERN) {
      if (internId !== user.id) throw forbidden();
      return;
    }
    if (!(await this.visibility.canViewIntern(user, internId))) throw forbidden();
  }

  private assertInternshipOpen(status: InternshipStatus) {
    if (CLOSED_INTERNSHIP_STATUSES.includes(status)) {
      throw conflict(
        'INTERNSHIP_CLOSED',
        'This internship is closed, so the task can no longer be changed by the intern.',
      );
    }
  }

  private assertTransition(from: TaskStatus, to: TaskStatus) {
    if (!TASK_TRANSITIONS[from].includes(to)) {
      throw conflict(
        'INVALID_TRANSITION',
        `A task that is ${from} can't be changed to ${to}.`,
      );
    }
  }

  // The task row is locked by loadLocked, so the status can't change underneath us.
  private async applyTransition(
    tx: Tx,
    task: { id: string; status: TaskStatus },
    to: TaskStatus,
    action: string,
    actorId: string,
    note?: string | null,
  ) {
    const updated = await tx.task.update({
      where: { id: task.id },
      data: { status: to },
      select: TASK_SELECT,
    });
    await tx.taskHistory.create({
      data: {
        taskId: task.id,
        action,
        fromStatus: task.status,
        toStatus: to,
        note: note ?? null,
        changedById: actorId,
      },
    });
    return updated;
  }

  private async loadLocked(tx: Tx, id: string) {
    await this.lockTask(tx, id);
    return tx.task.findUniqueOrThrow({
      where: { id },
      select: { ...TASK_SELECT, internship: { select: { status: true } } },
    });
  }

  private async lockTask(tx: Tx, id: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Task" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (rows.length === 0) throw taskNotFound();
  }

  private async lockInternship(tx: Tx, id: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Internship" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (rows.length === 0) throw notFound('Internship not found.');
  }

  private futureDeadline(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      throw badRequest('DEADLINE_IN_PAST', 'The deadline must be in the future.');
    }
    return date;
  }

  private commonFilters(
    query: ListMyTasksQueryDto,
    now: Date,
  ): Prisma.TaskWhereInput[] {
    const and: Prisma.TaskWhereInput[] = [];
    if (query.status) and.push({ status: query.status });
    if (query.priority) and.push({ priority: query.priority });

    const range = this.dateRange(query.deadlineFrom, query.deadlineTo);
    if (range) and.push({ deadline: range });

    if (query.overdue === true) {
      and.push({ deadline: { lt: now }, status: { not: TaskStatus.APPROVED } });
    } else if (query.overdue === false) {
      and.push({
        OR: [{ deadline: { gte: now } }, { status: TaskStatus.APPROVED }],
      });
    }
    return and;
  }

  private async page(
    where: Prisma.TaskWhereInput,
    query: ListMyTasksQueryDto,
    now: Date,
  ) {
    const orderBy = [
      { [query.sortBy]: query.order },
      { id: 'asc' },
    ] as Prisma.TaskOrderByWithRelationInput[];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        orderBy,
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: TASK_LIST_SELECT,
      }),
    ]);

    return paginated(
      rows.map((r) => toTaskListItem(r, now)),
      total,
      query.page,
      query.limit,
    );
  }

  private dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    if (!from && !to) return undefined;

    if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
      throw badRequest(
        'INVALID_DATE_RANGE',
        'deadlineFrom must not be after deadlineTo.',
      );
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