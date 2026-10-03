import { ApiPropertyOptional } from '@nestjs/swagger';
import { InternshipStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/page-query.dto';
import { INTERN_SORT_FIELDS } from '../internships.constants';

export class ListInternsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: INTERN_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(INTERN_SORT_FIELDS)
  sortBy: (typeof INTERN_SORT_FIELDS)[number] = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ format: 'uuid', description: 'Program id' })
  @IsOptional()
  @IsUUID()
  program?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Current mentor (staff user id)' })
  @IsOptional()
  @IsUUID()
  mentor?: string;

  @ApiPropertyOptional({ enum: InternshipStatus })
  @IsOptional()
  @IsEnum(InternshipStatus)
  status?: InternshipStatus;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progressMin?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progressMax?: number;
}