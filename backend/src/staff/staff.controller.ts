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
import { PageQueryDto } from '../common/pagination/page-query.dto';
import type { AuthUser } from '../common/types/auth-user';
import { ListStaffQueryDto } from './dto/list-staff-query.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { StaffService } from './staff.service';

@ApiTags('Staff')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'Not staff, or missing permission' })
@Roles(Role.STAFF)
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @ApiOperation({
    summary: 'List active staff (use ?status= only with CAN_MANAGE_USERS)',
  })
  @ApiOkResponse({ description: '{ data, meta }' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListStaffQueryDto) {
    return this.staff.list(user, query);
  }

  @Get('pending')
  @Permissions(Permission.CAN_MANAGE_USERS)
  @ApiOperation({ summary: 'List staff waiting for approval (oldest first)' })
  @ApiOkResponse({ description: '{ data, meta }' })
  pending(@Query() query: PageQueryDto) {
    return this.staff.listPending(query);
  }

  @Patch(':id/approve')
  @Permissions(Permission.CAN_MANAGE_USERS)
  @ApiOperation({ summary: 'Approve a pending staff account with permissions' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: '{ id, fullName, workEmail, status, permissions }' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION' })
  approve(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    return this.staff.approve(actorId, id, dto.permissions);
  }

  @Patch(':id/reject')
  @Permissions(Permission.CAN_MANAGE_USERS)
  @ApiOperation({ summary: 'Reject a pending staff account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: '{ id, status }' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION' })
  reject(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staff.reject(actorId, id);
  }

  @Patch(':id/permissions')
  @Permissions(Permission.CAN_MANAGE_USERS)
  @ApiOperation({ summary: 'Replace the full permission set of an active staff' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: '{ id, fullName, workEmail, status, permissions }' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({ description: 'INVALID_STATE or LAST_USER_MANAGER' })
  setPermissions(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    return this.staff.setPermissions(actorId, id, dto.permissions);
  }
}