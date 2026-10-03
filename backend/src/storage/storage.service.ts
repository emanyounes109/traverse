import type { Readable } from 'stream';

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface StorageService {
  save(buffer: Buffer): Promise<{ storageKey: string }>;
  read(storageKey: string): Promise<Readable>;
}