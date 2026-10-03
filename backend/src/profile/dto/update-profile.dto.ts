import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { lowerTrimString, trimString } from '../../common/utils/transforms';

export class UpdateProfileDto {
  @ValidateIf((o: UpdateProfileDto) => o.fullName !== undefined)
  @Transform(trimString)
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Length(6, 20)
  phone?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  contactInfo?: string | null;

  @ValidateIf((o: UpdateProfileDto) => o.workEmail !== undefined)
  @Transform(lowerTrimString)
  @IsEmail()
  @MaxLength(254)
  workEmail?: string;
}