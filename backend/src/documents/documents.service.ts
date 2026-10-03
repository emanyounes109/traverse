import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentType, Permission, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { cleanFileName } from '../common/files/file-name.util';
import { FileValidationService } from '../common/files/file-validation.service';
import { SignedUrlService } from '../common/files/signed-url.service';
import { paginated, skipOf } from '../common/pagination/pagination';
import type { AuthUser } from '../common/types/auth-user';
import { validationError } from '../common/utils/errors';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE } from '../storage/storage.service';
import type { StorageService } from '../storage/storage.service';
import { DocumentAccessService } from './document-access.service';
import {
  DOCUMENT_ACCESS_SELECT,
  DOCUMENT_SELECT,
  documentNotFound,
  forbidden,
  toPublicDocument,
} from './documents.constants';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';

const cvExists = () =>
  new ConflictException({
    code: 'DOCUMENT_EXISTS',
    message: 'You already have a CV. Upload a new version to replace it.',
  });

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly validator: FileValidationService,
    private readonly signer: SignedUrlService,
    private readonly access: DocumentAccessService,
  ) {}

  async create(
    user: AuthUser,
    dto: CreateDocumentDto,
    file: Express.Multer.File | undefined,
  ) {
    if (dto.type === DocumentType.SUBMISSION) {
      throw new BadRequestException({
        code: 'SUBMISSION_NOT_ALLOWED',
        message: 'Submissions are created through tasks.',
      });
    }
    if (dto.type === DocumentType.CV) return this.createCv(user, dto, file);
    return this.createInternshipDoc(user, dto, file);
  }

  async list(user: AuthUser, query: ListDocumentsQueryDto) {
    const filters: Prisma.DocumentWhereInput[] = [
      this.access.accessibleWhere(user),
      { isCurrent: true },
    ];
    if (query.internId) filters.push({ internId: query.internId });
    if (query.type) filters.push({ type: query.type });
    const where: Prisma.DocumentWhereInput = { AND: filters };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: skipOf(query.page, query.limit),
        take: query.limit,
        select: DOCUMENT_SELECT,
      }),
    ]);

    return paginated(rows, total, query.page, query.limit);
  }

  async getOne(user: AuthUser, id: string) {
    const doc = await this.getAccessible(user, id);
    const token = this.signer.sign({ documentId: doc.id, userId: user.id });
    return {
      ...toPublicDocument(doc),
      downloadUrl: `/api/v1/documents/${doc.id}/download?token=${token}`,
    };
  }

  async download(user: AuthUser, id: string, token: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: { ...DOCUMENT_ACCESS_SELECT, storageKey: true },
    });
    if (!doc) throw documentNotFound();

    this.signer.verify(token, { documentId: id, userId: user.id });
    if (!(await this.access.canAccess(user, doc))) throw forbidden();

    const stream = await this.storage.read(doc.storageKey);
    return {
      stream,
      name: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.sizeBytes,
    };
  }

  async listVersions(user: AuthUser, id: string) {
    const doc = await this.getAccessible(user, id);
    return this.prisma.document.findMany({
      where: { groupId: doc.groupId },
      orderBy: { version: 'desc' },
      select: DOCUMENT_SELECT,
    });
  }

  async addVersion(
    user: AuthUser,
    id: string,
    file: Express.Multer.File | undefined,
  ) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: DOCUMENT_ACCESS_SELECT,
    });
    if (!doc) throw documentNotFound();

    if (doc.type === DocumentType.SUBMISSION) {
      throw new BadRequestException({
        code: 'SUBMISSION_REPLACE_NOT_ALLOWED',
        message: 'Submissions are replaced through tasks.',
      });
    }

    const allowed =
      doc.type === DocumentType.CV
        ? user.role === Role.INTERN && doc.ownerId === user.id
        : user.role === Role.STAFF &&
          user.permissions.includes(Permission.CAN_CHANGE_INTERNSHIP_STATUS);
    if (!allowed) throw forbidden();

    const { mimeType } = this.validator.validate(file);
    const upload = file as Express.Multer.File;
    const { storageKey } = await this.storage.save(upload.buffer);

    const created = await this.prisma.$transaction(async (tx) => {
      await this.lock(tx, `doc-group:${doc.groupId}`);

      const latest = await tx.document.aggregate({
        where: { groupId: doc.groupId },
        _max: { version: true },
      });
      const nextVersion = (latest._max.version ?? 0) + 1;

      await tx.document.updateMany({
        where: { groupId: doc.groupId, isCurrent: true },
        data: { isCurrent: false },
      });

      const row = await tx.document.create({
        data: {
          ownerId: doc.ownerId,
          internId: doc.internId,
          type: doc.type,
          storageKey,
          originalName: cleanFileName(upload.originalname),
          mimeType,
          sizeBytes: upload.buffer.length,
          version: nextVersion,
          groupId: doc.groupId,
          isCurrent: true,
          uploadedById: user.id,
        },
        select: DOCUMENT_SELECT,
      });

      if (doc.type === DocumentType.CV) {
        await tx.internProfile.update({
          where: { userId: doc.ownerId },
          data: { cvDocumentId: row.id },
        });
      }
      return row;
    });

    return created;
  }

  // Used by the Tasks module inside its own transaction (the task row is
  // locked there, so the version number can't race). One group per task: the
  // first submission creates the group, later ones pass the same groupId.
  // If the transaction fails after the file was stored, the orphan file is ignored.
  async createSubmissionDocument(
    tx: Prisma.TransactionClient,
    params: {
      file: Express.Multer.File | undefined;
      internId: string;
      uploadedById: string;
      groupId?: string;
    },
  ) {
    const { mimeType } = this.validator.validate(params.file, { allowZip: true });
    const upload = params.file as Express.Multer.File;
    const { storageKey } = await this.storage.save(upload.buffer);

    const groupId = params.groupId ?? randomUUID();
    let version = 1;

    if (params.groupId) {
      const latest = await tx.document.aggregate({
        where: { groupId },
        _max: { version: true },
      });
      version = (latest._max.version ?? 0) + 1;
      await tx.document.updateMany({
        where: { groupId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return tx.document.create({
      data: {
        ownerId: params.internId,
        internId: params.internId,
        type: DocumentType.SUBMISSION,
        storageKey,
        originalName: cleanFileName(upload.originalname),
        mimeType,
        sizeBytes: upload.buffer.length,
        version,
        groupId,
        isCurrent: true,
        uploadedById: params.uploadedById,
      },
      select: DOCUMENT_SELECT,
    });
  }

  private async createCv(
    user: AuthUser,
    dto: CreateDocumentDto,
    file: Express.Multer.File | undefined,
  ) {
    if (user.role !== Role.INTERN) throw forbidden();
    if (dto.internId !== undefined && dto.internId !== user.id) {
      throw validationError(['internId is not allowed for CV uploads']);
    }

    const profile = await this.prisma.internProfile.findUnique({
      where: { userId: user.id },
      select: { cvDocumentId: true },
    });
    if (!profile) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found.',
      });
    }
    if (profile.cvDocumentId) throw cvExists();

    const { mimeType } = this.validator.validate(file);
    const upload = file as Express.Multer.File;
    const { storageKey } = await this.storage.save(upload.buffer);

    return this.prisma.$transaction(async (tx) => {
      await this.lock(tx, `cv:${user.id}`);

      const current = await tx.internProfile.findUnique({
        where: { userId: user.id },
        select: { cvDocumentId: true },
      });
      if (current?.cvDocumentId) throw cvExists();

      const row = await tx.document.create({
        data: {
          ownerId: user.id,
          internId: user.id,
          type: DocumentType.CV,
          storageKey,
          originalName: cleanFileName(upload.originalname),
          mimeType,
          sizeBytes: upload.buffer.length,
          version: 1,
          groupId: randomUUID(),
          isCurrent: true,
          uploadedById: user.id,
        },
        select: DOCUMENT_SELECT,
      });

      await tx.internProfile.update({
        where: { userId: user.id },
        data: { cvDocumentId: row.id },
      });
      return row;
    });
  }

  private async createInternshipDoc(
    user: AuthUser,
    dto: CreateDocumentDto,
    file: Express.Multer.File | undefined,
  ) {
    if (
      user.role !== Role.STAFF ||
      !user.permissions.includes(Permission.CAN_CHANGE_INTERNSHIP_STATUS)
    ) {
      throw forbidden();
    }
    if (!dto.internId) {
      throw validationError(['internId is required for INTERNSHIP_DOC']);
    }

    const intern = await this.prisma.user.findFirst({
      where: { id: dto.internId, role: Role.INTERN },
      select: { id: true },
    });
    if (!intern) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Intern not found.',
      });
    }

    const { mimeType } = this.validator.validate(file);
    const upload = file as Express.Multer.File;
    const { storageKey } = await this.storage.save(upload.buffer);

    return this.prisma.document.create({
      data: {
        ownerId: intern.id,
        internId: intern.id,
        type: DocumentType.INTERNSHIP_DOC,
        storageKey,
        originalName: cleanFileName(upload.originalname),
        mimeType,
        sizeBytes: upload.buffer.length,
        version: 1,
        groupId: randomUUID(),
        isCurrent: true,
        uploadedById: user.id,
      },
      select: DOCUMENT_SELECT,
    });
  }

  private async getAccessible(user: AuthUser, id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: DOCUMENT_ACCESS_SELECT,
    });
    if (!doc) throw documentNotFound();
    if (!(await this.access.canAccess(user, doc))) throw forbidden();
    return doc;
  }

  private async lock(tx: Prisma.TransactionClient, key: string) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }
}