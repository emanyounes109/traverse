import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsIsoDateTime } from '../../common/decorators/iso-date-time.decorator';

export class CreateInterviewDto {
  @ApiProperty({ format: 'uuid', description: 'User id of an ACTIVE staff member' })
  @IsUUID()
  interviewerId!: string;

  @ApiProperty({ example: '2026-12-01T10:00:00Z', description: 'Must be in the future' })
  @IsIsoDateTime()
  scheduledAt!: string;
}