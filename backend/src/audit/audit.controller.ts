import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { AUDIT_ENTITY_TYPES } from './audit.constants';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiCookieAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get(':entityType/:id')
  @ApiOperation({
    summary:
      'History of one record, oldest first (staff: CAN_VIEW_AUDIT + scope; intern: own records only)',
  })
  @ApiParam({ name: 'entityType', enum: AUDIT_ENTITY_TYPES })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'For mentor-assignments this is the INTERNSHIP id',
  })
  @ApiOkResponse({ description: '{ entityType, entityId, entries }' })
  @ApiBadRequestResponse({ description: 'INVALID_ENTITY_TYPE' })
  @ApiForbiddenResponse({ description: 'FORBIDDEN' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  get(
    @CurrentUser() user: AuthUser,
    @Param('entityType') entityType: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.audit.get(user, entityType, id);
  }
}