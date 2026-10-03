import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { lowerTrimString, trimString } from '../../common/utils/transforms';

export class RegisterDto {
  @IsIn([Role.INTERN, Role.STAFF])
  role!: Role;

  @Transform(lowerTrimString)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Length(8, 72)
  @Matches(/[A-Za-z]/, { message: 'password must contain at least one letter' })
  @Matches(/\d/, { message: 'password must contain at least one number' })
  password!: string;

  @Transform(trimString)
  @IsString()
  @Length(2, 100)
  fullName!: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Length(6, 20)
  phone?: string | null;

  @IsOptional()
  @Transform(lowerTrimString)
  @IsEmail()
  @MaxLength(254)
  workEmail?: string | null;
}