import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesModule } from '../common/files/files.module';
import { maxFileBytes } from '../common/files/files.constants';
import { StorageModule } from '../storage/storage.module';
import { DocumentAccessService } from './document-access.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    StorageModule,
    FilesModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: { fileSize: maxFileBytes(config), files: 1, fields: 10 },
      }),
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentAccessService],
  exports: [DocumentsService, DocumentAccessService],
})
export class DocumentsModule {}