import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createReadStream, promises as fs } from 'fs';
import { dirname, resolve, sep } from 'path';
import type { Readable } from 'stream';
import type { StorageService } from './storage.service';

const KEY_PATTERN =
  /^\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

@Injectable()
export class LocalDiskStorageService implements StorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get<string>('STORAGE_LOCAL_PATH') ?? './storage');
  }

  async save(buffer: Buffer): Promise<{ storageKey: string }> {
    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const storageKey = `${year}/${month}/${randomUUID()}`;

    const fullPath = this.resolveSafe(storageKey);
    await fs.mkdir(dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer, { flag: 'wx', mode: 0o600 });
    return { storageKey };
  }

  async read(storageKey: string): Promise<Readable> {
    const fullPath = this.resolveSafe(storageKey);
    try {
      await fs.access(fullPath);
    } catch {
      throw new NotFoundException({
        code: 'FILE_NOT_FOUND',
        message: 'The file could not be found.',
      });
    }
    return createReadStream(fullPath);
  }

  private resolveSafe(storageKey: string): string {
    if (!KEY_PATTERN.test(storageKey)) {
      throw new Error('Invalid storage key');
    }
    const fullPath = resolve(this.root, storageKey);
    if (!fullPath.startsWith(this.root + sep)) {
      throw new Error('Invalid storage key');
    }
    return fullPath;
  }
}