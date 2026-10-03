import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ApplicationsModule } from './applications/applications.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { parseDurationMs } from './common/utils/duration';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { InternshipsModule } from './internships/internships.module';
import { InterviewsModule } from './interviews/interviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { ProgramsModule } from './programs/programs.module';
import { StaffModule } from './staff/staff.module';
import { TasksModule } from './tasks/tasks.module';
import { VisibilityModule } from './visibility/visibility.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Math.floor(
            parseDurationMs(config.getOrThrow<string>('JWT_EXPIRES_IN')) / 1000,
          ),
        },
      }),
    }),
    PrismaModule,
    VisibilityModule,
    AuthModule,
    ProfileModule,
    ProgramsModule,
    ApplicationsModule,
    InterviewsModule,
    InternshipsModule,
    TasksModule,
    NotificationsModule,
    DashboardModule,
    AuditModule,
    StaffModule,
    DocumentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}