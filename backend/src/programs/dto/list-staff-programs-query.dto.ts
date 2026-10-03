import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProgramStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/page-query.dto';

export const PROGRAM_STAFF_SORT_FIELDS = [
  'createdAt',
  'name',
  'applicationOpenDate',
  'applicationCloseDate',
  'capacity',
] as const;

export class ListStaffProgramsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PROGRAM_STAFF_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(PROGRAM_STAFF_SORT_FIELDS)
  sortBy: (typeof PROGRAM_STAFF_SORT_FIELDS)[number] = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: ProgramStatus })
  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}