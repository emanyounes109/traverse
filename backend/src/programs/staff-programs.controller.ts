import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { ListStaffProgramsQueryDto } from './dto/list-staff-programs-query.dto';
import { ProgramsService } from './programs.service';

@ApiTags('Programs')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'Not staff' })
@Roles(Role.STAFF)
@Controller('staff/programs')
export class StaffProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Get()
  @ApiOperation({ summary: 'List all programs (any status) for staff' })
  @ApiOkResponse({ description: '{ data, meta }' })
  list(@Query() query: ListStaffProgramsQueryDto) {
    return this.programs.listForStaff(query);
  }
}