import { Module } from '@nestjs/common';
import { FileValidationService } from './file-validation.service';
import { SignedUrlService } from './signed-url.service';

@Module({
  providers: [FileValidationService, SignedUrlService],
  exports: [FileValidationService, SignedUrlService],
})
export class FilesModule {}