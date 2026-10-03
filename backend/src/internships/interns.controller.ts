import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { ListInternsQueryDto } from './dto/list-interns-query.dto';
import { InternsService } from './interns.service';

@ApiTags('Interns')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'FORBIDDEN' })
@Controller('interns')
export class InternsController {
  constructor(private readonly interns: InternsService) {}

  @Get()
  @Roles(Role.STAFF)
  @ApiOperation({
    summary: 'List interns in your scope (CAN_VIEW_ALL_INTERNS or your mentees)',
  })
  @ApiOkResponse({ description: '{ data, meta } with progress' })
  @ApiBadRequestResponse({ description: 'VALIDATION_ERROR or INVALID_PROGRESS_RANGE' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListInternsQueryDto) {
    return this.interns.list(user, query);
  }

  @Get(':id')
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'Intern profile + internships (:id is the intern USER id)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'profile, internships, currentMentor, progress' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.interns.getOne(user, id);
  }

  @Get(':id/mentor-history')
  @ApiOperation({
    summary: 'All mentor assignments of the intern, newest first (owner intern or staff in scope)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Array of assignments' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  mentorHistory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.interns.mentorHistory(user, id);
  }
}