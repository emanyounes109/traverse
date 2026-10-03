import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { IsIsoDateTime } from '../../common/decorators/iso-date-time.decorator';
import { trimString } from '../../common/utils/transforms';

export class CreateProgramDto {
  @ApiProperty({ minLength: 3, maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @Length(3, 150)
  name!: string;

  @ApiProperty({ minLength: 1, maxLength: 5000 })
  @Transform(trimString)
  @IsString()
  @Length(1, 5000)
  description!: string;

  @ApiProperty({ minLength: 1, maxLength: 5000 })
  @Transform(trimString)
  @IsString()
  @Length(1, 5000)
  requirements!: string;

  @ApiProperty({ example: '2026-10-01T00:00:00Z' })
  @IsIsoDateTime()
  applicationOpenDate!: string;

  @ApiProperty({ example: '2026-11-05T00:00:00Z' })
  @IsIsoDateTime()
  applicationCloseDate!: string;

  @ApiProperty({ example: '2026-12-01T00:00:00Z' })
  @IsIsoDateTime()
  internshipStartDate!: string;

  @ApiProperty({ example: '2027-03-01T00:00:00Z' })
  @IsIsoDateTime()
  internshipEndDate!: string;

  @ApiProperty({ minimum: 1, maximum: 100000 })
  @IsInt()
  @Min(1)
  @Max(100000)
  capacity!: number;
}