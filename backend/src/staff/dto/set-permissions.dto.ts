import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum } from 'class-validator';

export class SetPermissionsDto {
  @ApiProperty({ enum: Permission, isArray: true, maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissions!: Permission[];
}