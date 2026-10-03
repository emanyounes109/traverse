import { Module } from '@nestjs/common';
import { InternsController } from './interns.controller';
import { InternsService } from './interns.service';
import { InternshipsController } from './internships.controller';
import { InternshipsService } from './internships.service';
import { StaffWorkloadController } from './staff-workload.controller';

@Module({
  controllers: [
    InternshipsController,
    InternsController,
    StaffWorkloadController,
  ],
  providers: [InternshipsService, InternsService],
  exports: [InternshipsService, InternsService],
})
export class InternshipsModule {}