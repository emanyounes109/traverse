import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { maxFileBytes } from './files.constants';

interface FileRule {
  mimes: string[];
  exts: string[];
  magic: number[][];
  zipOnly?: boolean;
}

const RULES: FileRule[] = [
  {
    mimes: ['application/pdf'],
    exts: ['.pdf'],
    magic: [[0x25, 0x50, 0x44, 0x46]],
  },
  {
    mimes: ['application/msword'],
    exts: ['.doc'],
    magic: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  },
  {
    mimes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    exts: ['.docx'],
    magic: [[0x50, 0x4b, 0x03, 0x04]],
  },
  {
    mimes: ['image/png'],
    exts: ['.png'],
    magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  {
    mimes: ['image/jpeg'],
    exts: ['.jpg', '.jpeg'],
    magic: [[0xff, 0xd8, 0xff]],
  },
  {
    mimes: ['application/zip', 'application/x-zip-compressed'],
    exts: ['.zip'],
    magic: [[0x50, 0x4b, 0x03, 0x04]],
    zipOnly: true,
  },
];

@Injectable()
export class FileValidationService {
  private readonly maxBytes: number;

  constructor(config: ConfigService) {
    this.maxBytes = maxFileBytes(config);
  }

  validate(
    file: Express.Multer.File | undefined,
    options: { allowZip?: boolean } = {},
  ): { mimeType: string } {
    if (!file || !file.buffer) {
      throw new BadRequestException({
        code: 'FILE_REQUIRED',
        message: 'A file is required.',
      });
    }

    if (file.buffer.length > this.maxBytes) {
      throw new PayloadTooLargeException({
        code: 'FILE_TOO_LARGE',
        message: `The file is too large. The maximum size is ${this.maxBytes / 1024 / 1024} MB.`,
      });
    }

    const mime = (file.mimetype ?? '').toLowerCase();
    const ext = extname(file.originalname ?? '').toLowerCase();
    const rule = RULES.find(
      (r) => r.mimes.includes(mime) && (!r.zipOnly || options.allowZip),
    );

    const magicOk =
      !!rule &&
      rule.magic.some((sig) => sig.every((b, i) => file.buffer[i] === b));

    if (!rule || !rule.exts.includes(ext) || !magicOk) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: options.allowZip
          ? 'Allowed files: PDF, DOC, DOCX, PNG, JPG, ZIP.'
          : 'Allowed files: PDF, DOC, DOCX, PNG, JPG.',
      });
    }

    return { mimeType: rule.mimes[0] };
  }
}