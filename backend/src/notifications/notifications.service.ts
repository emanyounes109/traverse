import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { paginated, skipOf } from '../common/pagination/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NOTIFICATION_SELECT } from './notifications.constants';

const notFound = () =>
  new NotFoundException({
    code: 'NOT_FOUND',
    message: 'Notification not found.',
  });

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userIds: string[],
    type: NotificationType,
    payload: Prisma.InputJsonObject,
  ): Promise<number> {
    const recipients = [...new Set(userIds)];
    if (recipients.length === 0) return 0;

    try {
      const result = await this.prisma.notification.createMany({
        data: recipients.map((userId) => ({ userId, type, payload })),
        skipDuplicates: true,
      });
      return result.count;
    } catch (e) {
      // A duplicate deadline reminder (unique index) is ignored quietly.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return 0;
      }
      throw e;
    }
  }

  async list(userId: string, query: ListNotificationsQueryDto) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.unread === true) where.readAt = null;

    const [total, rows, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: NOTIFICATION_SELECT,
      }),
      // All unread of the user, regardless of the filter or the page.
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return { ...paginated(rows, total, query.page, query.limit), unreadCount };
  }

  async markRead(userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: NOTIFICATION_SELECT,
    });
    if (!existing) throw notFound();
    if (existing.readAt) return existing;

    // readAt: null in the filter keeps the old readAt if a parallel request won.
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return this.prisma.notification.findFirstOrThrow({
      where: { id, userId },
      select: NOTIFICATION_SELECT,
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}