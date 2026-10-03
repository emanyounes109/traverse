import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
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
import { PaginationQueryDto } from '../../common/pagination/page-query.dto';
import { TASK_SORT_FIELDS } from '../tasks.constants';

const DATE_MESSAGE =
  '$property must be a date (2026-10-01) or a date-time with a timezone (2026-10-01T00:00:00Z)';

export class ListMyTasksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TASK_SORT_FIELDS, default: 'deadline' })
  @IsOptional()
  @IsIn(TASK_SORT_FIELDS)
  sortBy: (typeof TASK_SORT_FIELDS)[number] = 'deadline';

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(DATE_OR_DATE_TIME, { message: DATE_MESSAGE })
  @IsISO8601({ strict: true })
  deadlineFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Matches(DATE_OR_DATE_TIME, { message: DATE_MESSAGE })
  @IsISO8601({ strict: true })
  deadlineTo?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'true = deadline passed and not approved',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  overdue?: boolean;
}

export class ListTasksQueryDto extends ListMyTasksQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  internId?: string;
}