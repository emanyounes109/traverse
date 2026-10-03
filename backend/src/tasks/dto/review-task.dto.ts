import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../common/utils/transforms';
import { ReviewDecision } from '../tasks.constants';

export class ReviewTaskDto {
  @ApiProperty({ enum: ReviewDecision })
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @ApiPropertyOptional({
    maxLength: 2000,
    description: 'Required for REQUEST_CHANGES, optional for APPROVE',
  })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}