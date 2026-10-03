import { ConfigService } from '@nestjs/config';

export function maxFileBytes(config: ConfigService): number {
  const mb = Number(config.get<string>('MAX_FILE_MB') ?? 10);
  return (Number.isFinite(mb) && mb > 0 ? mb : 10) * 1024 * 1024;
}