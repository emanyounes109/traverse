import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'FORBIDDEN' })
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('intern')
  @Roles(Role.INTERN)
  @ApiOperation({ summary: 'Intern dashboard' })
  @ApiOkResponse({
    description:
      'internship (nullable), progressPercent, taskCounts (all 6 statuses), upcomingDeadlines (max 5), recentFeedback (max 5), currentMentor (nullable), nextInterview (nullable)',
  })
  intern(@CurrentUser() user: AuthUser) {
    return this.dashboard.intern(user);
  }

  @Get('staff')
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'Staff dashboard (numbers limited to your scope)' })
  @ApiOkResponse({
    description:
      'interns, tasks, internProgress, overdueTasks, unassignedInterns are always present. applicationsByStatus is null without CAN_REVIEW_APPLICATIONS. upcomingInterviews is null without CAN_MANAGE_INTERVIEWS or CAN_REVIEW_APPLICATIONS. mentorWorkload is null without CAN_ASSIGN_MENTOR or CAN_VIEW_ALL_INTERNS.',
  })
  staff(@CurrentUser() user: AuthUser) {
    return this.dashboard.staff(user);
  }
}