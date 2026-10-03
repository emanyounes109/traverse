import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InternshipStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, Length, ValidateIf } from 'class-validator';
import { trimString } from '../../common/utils/transforms';

export class ChangeInternshipStatusDto {
  @ApiProperty({ enum: InternshipStatus })
  @IsEnum(InternshipStatus)
  toStatus!: InternshipStatus;

  @ApiPropertyOptional({
    maxLength: 500,
    description: 'Required when toStatus is DROPPED',
  })
  @ValidateIf(
    (o: ChangeInternshipStatusDto) =>
      o.toStatus === InternshipStatus.DROPPED || o.reason !== undefined,
  )
  @Transform(trimString)
  @IsString()
  @Length(1, 500)
  reason?: string;
}