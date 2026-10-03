import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewResult } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsIsoDateTime } from '../../common/decorators/iso-date-time.decorator';
import { trimString } from '../../common/utils/transforms';
import { InterviewAction } from '../interviews.constants';

export class UpdateInterviewDto {
  @ApiProperty({ enum: InterviewAction })
  @IsEnum(InterviewAction)
  action!: InterviewAction;

  @ApiPropertyOptional({
    example: '2026-12-05T09:00:00Z',
    description: 'RESCHEDULE only (required, in the future)',
  })
  @ValidateIf((o: UpdateInterviewDto) => o.action === InterviewAction.RESCHEDULE)
  @IsIsoDateTime()
  scheduledAt?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'RESCHEDULE only (optional, ACTIVE staff)',
  })
  @ValidateIf((o: UpdateInterviewDto) => o.interviewerId !== undefined)
  @IsUUID()
  interviewerId?: string;

  @ApiPropertyOptional({
    maxLength: 500,
    description: 'CANCEL only (required)',
  })
  @ValidateIf((o: UpdateInterviewDto) => o.action === InterviewAction.CANCEL)
  @Transform(trimString)
  @IsString()
  @Length(1, 500)
  reason?: string;

  @ApiPropertyOptional({
    enum: InterviewResult,
    description: 'COMPLETE only (required)',
  })
  @ValidateIf((o: UpdateInterviewDto) => o.action === InterviewAction.COMPLETE)
  @IsEnum(InterviewResult)
  result?: InterviewResult;

  @ApiPropertyOptional({ maxLength: 2000, description: 'COMPLETE only (optional)' })
  @ValidateIf((o: UpdateInterviewDto) => o.notes !== undefined)
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  notes?: string;
}