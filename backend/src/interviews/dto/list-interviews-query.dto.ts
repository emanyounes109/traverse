import { ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { DATE_OR_DATE_TIME } from '../../applications/applications.constants';
import { PageQueryDto } from '../../common/pagination/page-query.dto';

const DATE_MESSAGE =
  '$property must be a date (2026-10-01) or a date-time with a timezone (2026-10-01T00:00:00Z)';

export class ListInterviewsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ['scheduledAt', 'createdAt'], default: 'scheduledAt' })
  @IsOptional()
  @IsIn(['scheduledAt', 'createdAt'])
  sortBy: 'scheduledAt' | 'createdAt' = 'scheduledAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  interviewerId?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(DATE_OR_DATE_TIME, { message: DATE_MESSAGE })
  @IsISO8601({ strict: true })
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Matches(DATE_OR_DATE_TIME, { message: DATE_MESSAGE })
  @IsISO8601({ strict: true })
  to?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'true = active interviews from now on, sorted by scheduledAt asc',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  upcoming?: boolean;
}