import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignMentorDto {
  @ApiProperty({ format: 'uuid', description: 'User id of an ACTIVE staff member' })
  @IsUUID()
  staffId!: string;
}