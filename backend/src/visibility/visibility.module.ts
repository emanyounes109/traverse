import { Global, Module } from '@nestjs/common';
import { StaffVisibilityService } from './staff-visibility.service';

@Global()
@Module({
  providers: [StaffVisibilityService],
  exports: [StaffVisibilityService],
})
export class VisibilityModule {}