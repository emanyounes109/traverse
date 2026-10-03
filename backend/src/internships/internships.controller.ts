import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { AssignMentorDto } from './dto/assign-mentor.dto';
import { ChangeInternshipStatusDto } from './dto/change-internship-status.dto';
import { InternshipsService } from './internships.service';

@ApiTags('Internships')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'FORBIDDEN' })
@Controller('internships')
export class InternshipsController {
  constructor(private readonly internships: InternshipsService) {}

  @Get('me')
  @Roles(Role.INTERN)
  @ApiOperation({ summary: 'My internship (latest), with mentor and progress' })
  @ApiOkResponse({ description: 'Internship + program + mentor + progress' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  getMine(@CurrentUser('id') internId: string) {
    return this.internships.getMine(internId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Internship details (owner intern or staff in scope)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Internship + program + intern + mentor + progress' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.internships.getOne(user, id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Status history, oldest first (owner intern or staff in scope)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Array of history rows' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  history(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.internships.history(user, id);
  }

  @Patch(':id/status')
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_CHANGE_INTERNSHIP_STATUS)
  @ApiOperation({ summary: 'Change the internship status (staff in scope)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'The updated internship (+ warning INCOMPLETE_TASKS on completion)',
  })
  @ApiBadRequestResponse({ description: 'VALIDATION_ERROR (reason is required for DROPPED)' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION or MENTOR_REQUIRED' })
  changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeInternshipStatusDto,
  ) {
    return this.internships.changeStatus(user, id, dto);
  }

  @Post(':id/mentor')
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_ASSIGN_MENTOR)
  @ApiOperation({ summary: 'Assign (or change) the mentor of an internship' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'The new assignment (+ warning MENTOR_AT_CAPACITY if the mentor is full)',
  })
  @ApiBadRequestResponse({ description: 'INVALID_MENTOR or VALIDATION_ERROR' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({
    description: 'INTERNSHIP_CLOSED, ALREADY_CURRENT_MENTOR or ACTIVE_MENTOR_EXISTS',
  })
  assignMentor(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMentorDto,
  ) {
    return this.internships.assignMentor(user, id, dto);
  }
}