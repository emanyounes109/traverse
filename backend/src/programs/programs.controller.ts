import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import type { AuthUser } from '../common/types/auth-user';
import { CreateProgramDto } from './dto/create-program.dto';
import { ListProgramsQueryDto } from './dto/list-programs-query.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramsService } from './programs.service';

@ApiTags('Programs')
@ApiCookieAuth()
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Post()
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_PROGRAMS)
  @ApiOperation({ summary: 'Create a program (starts as DRAFT)' })
  @ApiCreatedResponse({ description: 'The program with acceptedCount and seatsLeft' })
  @ApiBadRequestResponse({ description: 'VALIDATION_ERROR or INVALID_DATES' })
  @ApiForbiddenResponse({ description: 'FORBIDDEN' })
  create(@CurrentUser('id') actorId: string, @Body() dto: CreateProgramDto) {
    return this.programs.create(actorId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List OPEN programs whose application window includes now',
  })
  @ApiOkResponse({ description: '{ data, meta }' })
  list(@Query() query: ListProgramsQueryDto) {
    return this.programs.listOpen(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Program details (interns: only OPEN programs or ones they applied to)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The program with acceptedCount and seatsLeft' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.programs.getOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_PROGRAMS)
  @ApiOperation({ summary: 'Edit a program (fields are locked by status)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated program' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({
    description: 'FIELD_LOCKED, PROGRAM_ARCHIVED or CAPACITY_BELOW_ACCEPTED',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programs.update(id, dto);
  }

  @Post(':id/publish')
  @HttpCode(200)
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_PROGRAMS)
  @ApiOperation({ summary: 'DRAFT -> OPEN' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated program' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION' })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.programs.publish(id);
  }

  @Post(':id/close')
  @HttpCode(200)
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_PROGRAMS)
  @ApiOperation({ summary: 'OPEN -> CLOSED' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated program' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION' })
  close(@Param('id', ParseUUIDPipe) id: string) {
    return this.programs.close(id);
  }

  @Post(':id/start')
  @HttpCode(200)
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_PROGRAMS)
  @ApiOperation({ summary: 'CLOSED -> IN_PROGRESS' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated program' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION' })
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.programs.start(id);
  }

  @Post(':id/complete')
  @HttpCode(200)
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_PROGRAMS)
  @ApiOperation({ summary: 'IN_PROGRESS -> COMPLETED' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated program' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.programs.complete(id);
  }

  @Post(':id/archive')
  @HttpCode(200)
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_PROGRAMS)
  @ApiOperation({ summary: 'DRAFT, CLOSED or COMPLETED -> ARCHIVED' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated program' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.programs.archive(id);
  }
}