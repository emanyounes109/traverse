import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { PageQueryDto } from '../common/pagination/page-query.dto';
import type { AuthUser } from '../common/types/auth-user';
import { ApplicationsService } from './applications.service';
import { ChangeApplicationStatusDto } from './dto/change-application-status.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';

@ApiTags('Applications')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'FORBIDDEN' })
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  @Roles(Role.INTERN)
  @ApiOperation({ summary: 'Apply to an open program (intern)' })
  @ApiCreatedResponse({ description: 'The new application (status APPLIED)' })
  @ApiBadRequestResponse({ description: 'CV_REQUIRED or VALIDATION_ERROR' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND (program)' })
  @ApiConflictResponse({
    description: 'PROGRAM_NOT_OPEN, APPLICATION_WINDOW_CLOSED or ALREADY_APPLIED',
  })
  create(
    @CurrentUser('id') internId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applications.apply(internId, dto);
  }

  @Get('me')
  @Roles(Role.INTERN)
  @ApiOperation({ summary: 'My applications, newest first (intern)' })
  @ApiOkResponse({ description: '{ data, meta }' })
  listMine(@CurrentUser('id') internId: string, @Query() query: PageQueryDto) {
    return this.applications.listMine(internId, query);
  }

  @Get()
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_REVIEW_APPLICATIONS)
  @ApiOperation({ summary: 'List all applications (CAN_REVIEW_APPLICATIONS)' })
  @ApiOkResponse({ description: '{ data, meta }' })
  @ApiBadRequestResponse({ description: 'VALIDATION_ERROR or INVALID_DATE_RANGE' })
  list(@Query() query: ListApplicationsQueryDto) {
    return this.applications.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Application details: the owner intern, or staff with CAN_REVIEW_APPLICATIONS',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Application + program + intern + history + interviews' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applications.getOne(user, id);
  }

  @Patch(':id/status')
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_REVIEW_APPLICATIONS)
  @ApiOperation({
    summary: 'Change the status (ACCEPTED also creates the internship)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated application (+ internshipId on accept)' })
  @ApiBadRequestResponse({ description: 'USE_INTERVIEW_ENDPOINT or VALIDATION_ERROR' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({
    description: 'INVALID_TRANSITION, INTERVIEW_NOT_PASSED or PROGRAM_FULL',
  })
  changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeApplicationStatusDto,
  ) {
    return this.applications.changeStatus(user, id, dto);
  }
}