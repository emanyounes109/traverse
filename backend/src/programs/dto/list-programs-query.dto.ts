import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/page-query.dto';

export const PROGRAM_PUBLIC_SORT_FIELDS = [
  'applicationCloseDate',
  'createdAt',
  'name',
] as const;

export class ListProgramsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: PROGRAM_PUBLIC_SORT_FIELDS,
    default: 'applicationCloseDate',
  })
  @IsOptional()
  @IsIn(PROGRAM_PUBLIC_SORT_FIELDS)
  sortBy: (typeof PROGRAM_PUBLIC_SORT_FIELDS)[number] = 'applicationCloseDate';
}