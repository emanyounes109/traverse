import { Module } from '@nestjs/common';
import { DeadlineRemindersService } from './deadline-reminders.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsListener } from './notifications.listener';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsListener,
    DeadlineRemindersService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}