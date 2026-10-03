import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { attachmentDisposition } from '../common/files/file-name.util';
import type { AuthUser } from '../common/types/auth-user';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DownloadQueryDto } from './dto/download-query.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { DocumentsService } from './documents.service';

const createBody = {
  schema: {
    type: 'object',
    required: ['type', 'file'],
    properties: {
      type: { type: 'string', enum: Object.values(DocumentType) },
      internId: { type: 'string', format: 'uuid' },
      file: { type: 'string', format: 'binary' },
    },
  },
};

const versionBody = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: { file: { type: 'string', format: 'binary' } },
  },
};

@ApiTags('Documents')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'FORBIDDEN' })
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a CV (intern) or an internship doc (staff)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(createBody)
  @ApiCreatedResponse({ description: 'The created document' })
  @ApiConflictResponse({ description: 'DOCUMENT_EXISTS' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documents.create(user, dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'List current documents you can access' })
  @ApiOkResponse({ description: '{ data, meta }' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListDocumentsQueryDto) {
    return this.documents.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Document metadata with a fresh signed downloadUrl' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Document + downloadUrl' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documents.getOne(user, id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download the file (valid signed token required)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiProduces('application/octet-stream')
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  async download(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DownloadQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.documents.download(user, id, query.token);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': attachmentDisposition(file.name),
      'Content-Length': String(file.size),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(file.stream);
  }

  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Replace a document by uploading a new version' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(versionBody)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ description: 'The new current version' })
  addVersion(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documents.addVersion(user, id, file);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'All versions of the document group, newest first' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Array of versions' })
  listVersions(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documents.listVersions(user, id);
  }
}