import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../common/utils/transforms';
import { PATCHABLE_STATUSES } from '../applications.constants';

export class ChangeApplicationStatusDto {
  @ApiProperty({
    enum: PATCHABLE_STATUSES,
    description: 'INTERVIEW is not allowed here: schedule an interview instead.',
  })
  @IsIn([...PATCHABLE_STATUSES, ApplicationStatus.INTERVIEW])
  toStatus!: ApplicationStatus;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(1000)
  note?: string;
}