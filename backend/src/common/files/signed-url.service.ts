import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

interface TokenSubject {
  documentId: string;
  userId: string;
}

const invalidToken = () =>
  new ForbiddenException({
    code: 'INVALID_DOWNLOAD_TOKEN',
    message: 'This download link is not valid.',
  });

const expiredToken = () =>
  new ForbiddenException({
    code: 'DOWNLOAD_TOKEN_EXPIRED',
    message: 'This download link has expired. Please request a new one.',
  });

@Injectable()
export class SignedUrlService {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor(config: ConfigService) {
    this.secret = config.getOrThrow<string>('SIGNED_URL_SECRET');
    const ttl = Number(config.get<string>('SIGNED_URL_TTL_SECONDS') ?? 300);
    this.ttlSeconds = Number.isFinite(ttl) && ttl > 0 ? Math.floor(ttl) : 300;
  }

  sign(subject: TokenSubject): string {
    const payload = Buffer.from(
      JSON.stringify({
        d: subject.documentId,
        u: subject.userId,
        e: Math.floor(Date.now() / 1000) + this.ttlSeconds,
      }),
    ).toString('base64url');
    return `${payload}.${this.mac(payload)}`;
  }

  verify(token: string, expected: TokenSubject): void {
    const parts = token.split('.');
    if (parts.length !== 2) throw invalidToken();
    const [payload, signature] = parts;

    const given = Buffer.from(signature, 'base64url');
    const wanted = Buffer.from(this.mac(payload), 'base64url');
    if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
      throw invalidToken();
    }

    let data: { d?: unknown; u?: unknown; e?: unknown };
    try {
      data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      throw invalidToken();
    }

    if (
      typeof data.e !== 'number' ||
      data.d !== expected.documentId ||
      data.u !== expected.userId
    ) {
      throw invalidToken();
    }
    if (data.e < Math.floor(Date.now() / 1000)) throw expiredToken();
  }

  private mac(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }
}