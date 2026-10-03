import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../types/auth-user';

const unauthorized = () =>
  new UnauthorizedException({
    code: 'UNAUTHORIZED',
    message: 'Please sign in to continue.',
  });

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: string | undefined =
      req.cookies?.[this.config.getOrThrow<string>('COOKIE_NAME')];
    if (!token) throw unauthorized();

    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string }>(token);
    } catch {
      throw unauthorized();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        status: true,
        staffProfile: { select: { permissions: true } },
      },
    });
    if (!user || user.status !== UserStatus.ACTIVE) throw unauthorized();

    req.user = {
      id: user.id,
      role: user.role,
      permissions: user.staffProfile?.permissions ?? [],
    };
    return true;
  }
}