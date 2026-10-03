import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/page-query.dto';
import { DATE_OR_DATE_TIME } from '../applications.constants';

const DATE_MESSAGE =
  '$property must be a date (2026-10-01) or a date-time with a timezone (2026-10-01T00:00:00Z)';

export class ListApplicationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['appliedAt', 'status'], default: 'appliedAt' })
  @IsOptional()
  @IsIn(['appliedAt', 'status'])
  sortBy: 'appliedAt' | 'status' = 'appliedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(DATE_OR_DATE_TIME, { message: DATE_MESSAGE })
  @IsISO8601({ strict: true })
  appliedFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Matches(DATE_OR_DATE_TIME, { message: DATE_MESSAGE })
  @IsISO8601({ strict: true })
  appliedTo?: string;
}