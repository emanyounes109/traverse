import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
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
import { CreateInterviewDto } from './dto/create-interview.dto';
import { InterviewsService } from './interviews.service';

@ApiTags('Interviews')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'FORBIDDEN' })
@Controller('applications/:applicationId/interviews')
export class ApplicationInterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Post()
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_INTERVIEWS)
  @ApiOperation({
    summary:
      'Schedule an interview (moves a SHORTLISTED application to INTERVIEW)',
  })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'The new interview (status SCHEDULED)' })
  @ApiBadRequestResponse({
    description: 'VALIDATION_ERROR, INVALID_INTERVIEWER or SCHEDULED_AT_IN_PAST',
  })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({
    description:
      'APPLICATION_NOT_ELIGIBLE, ACTIVE_INTERVIEW_EXISTS or INTERVIEW_ALREADY_DECIDED',
  })
  create(
    @CurrentUser() user: AuthUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviews.create(user, applicationId, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Interviews of an application, newest first (owner intern or staff). Interns do not see notes.',
  })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiOkResponse({ description: 'Array of interviews' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  list(
    @CurrentUser() user: AuthUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.interviews.listForApplication(user, applicationId);
  }
}