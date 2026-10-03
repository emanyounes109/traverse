import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/page-query.dto';

export class ListStaffQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['fullName', 'createdAt'], default: 'fullName' })
  @IsOptional()
  @IsIn(['fullName', 'createdAt'])
  sortBy: 'fullName' | 'createdAt' = 'fullName';

  @ApiPropertyOptional({
    enum: UserStatus,
    description: 'Requires CAN_MANAGE_USERS',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}