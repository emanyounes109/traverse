import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
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
import { PageQueryDto } from '../common/pagination/page-query.dto';
import type { AuthUser } from '../common/types/auth-user';
import { InternsService } from './interns.service';

@ApiTags('Staff')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'FORBIDDEN' })
@Roles(Role.STAFF)
@Controller('staff')
export class StaffWorkloadController {
  constructor(private readonly interns: InternsService) {}

  @Get('workload')
  @ApiOperation({
    summary: 'Mentor workload of active staff (CAN_ASSIGN_MENTOR or CAN_VIEW_ALL_INTERNS)',
  })
  @ApiOkResponse({ description: 'Array of { id, fullName, workEmail, activeInternCount, maxInterns, atCapacity }' })
  workload(@CurrentUser() user: AuthUser) {
    return this.interns.workload(user);
  }

  @Get(':id/interns')
  @ApiOperation({
    summary: 'Interns currently mentored by this staff (CAN_VIEW_ALL_INTERNS or yourself)',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Staff user id' })
  @ApiOkResponse({ description: '{ data, meta }' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  listForMentor(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PageQueryDto,
  ) {
    return this.interns.listForMentor(user, id, query);
  }
}