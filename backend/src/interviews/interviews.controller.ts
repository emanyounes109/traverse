import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Permission, Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { ListInterviewsQueryDto } from './dto/list-interviews-query.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { InterviewsService } from './interviews.service';

@ApiTags('Interviews')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'FORBIDDEN' })
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Get()
  @Roles(Role.STAFF)
  @ApiOperation({
    summary:
      'List interviews (staff with CAN_MANAGE_INTERVIEWS or CAN_REVIEW_APPLICATIONS)',
  })
  @ApiOkResponse({ description: '{ data, meta }' })
  @ApiBadRequestResponse({ description: 'VALIDATION_ERROR or INVALID_DATE_RANGE' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListInterviewsQueryDto) {
    return this.interviews.list(user, query);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Interview details with history (owner intern or staff). Interns do not see notes.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Interview + application + history' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.interviews.getOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_INTERVIEWS)
  @ApiOperation({ summary: 'Reschedule, cancel or complete an interview' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({
    type: UpdateInterviewDto,
    examples: {
      reschedule: {
        summary: 'RESCHEDULE',
        value: {
          action: 'RESCHEDULE',
          scheduledAt: '2026-12-05T09:00:00Z',
          interviewerId: '<optional staff user id>',
        },
      },
      cancel: {
        summary: 'CANCEL',
        value: { action: 'CANCEL', reason: 'Interviewer is unavailable' },
      },
      complete: {
        summary: 'COMPLETE',
        value: {
          action: 'COMPLETE',
          result: 'PASSED',
          notes: 'Strong technical skills.',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'The updated interview' })
  @ApiBadRequestResponse({
    description: 'VALIDATION_ERROR, INVALID_INTERVIEWER or SCHEDULED_AT_IN_PAST',
  })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.interviews.update(user, id, dto);
  }
}