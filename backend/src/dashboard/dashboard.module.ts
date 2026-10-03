import { Module } from '@nestjs/common';
import { InternshipsModule } from '../internships/internships.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [InternshipsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}