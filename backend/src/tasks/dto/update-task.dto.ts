import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, Length, ValidateIf } from 'class-validator';
import { IsIsoDateTime } from '../../common/decorators/iso-date-time.decorator';
import { trimString } from '../../common/utils/transforms';

export class UpdateTaskDto {
  @ApiPropertyOptional({ minLength: 3, maxLength: 200 })
  @ValidateIf((o: UpdateTaskDto) => o.title !== undefined)
  @Transform(trimString)
  @IsString()
  @Length(3, 200)
  title?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 5000 })
  @ValidateIf((o: UpdateTaskDto) => o.description !== undefined)
  @Transform(trimString)
  @IsString()
  @Length(1, 5000)
  description?: string;

  @ApiPropertyOptional({ example: '2026-12-20T17:00:00Z' })
  @ValidateIf((o: UpdateTaskDto) => o.deadline !== undefined)
  @IsIsoDateTime()
  deadline?: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @ValidateIf((o: UpdateTaskDto) => o.priority !== undefined)
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}