import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { IsIsoDateTime } from '../../common/decorators/iso-date-time.decorator';
import { trimString } from '../../common/utils/transforms';

export class CreateTaskDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  internshipId!: string;

  @ApiProperty({ minLength: 3, maxLength: 200 })
  @Transform(trimString)
  @IsString()
  @Length(3, 200)
  title!: string;

  @ApiProperty({ minLength: 1, maxLength: 5000 })
  @Transform(trimString)
  @IsString()
  @Length(1, 5000)
  description!: string;

  @ApiProperty({ example: '2026-12-15T17:00:00Z', description: 'Must be in the future' })
  @IsIsoDateTime()
  deadline!: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}