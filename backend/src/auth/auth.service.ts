import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { normalizeEmail } from '../common/utils/email';
import { validationError } from '../common/utils/errors';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_COST = 12;
const DUMMY_HASH = bcrypt.hashSync('traverse-dummy-password-1', BCRYPT_COST);

const SESSION_SELECT = {
  id: true,
  email: true,
  role: true,
  status: true,
  internProfile: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      contactInfo: true,
      cvDocumentId: true,
    },
  },
  staffProfile: {
    select: { id: true, fullName: true, workEmail: true, permissions: true },
  },
} satisfies Prisma.UserSelect;

type SessionUser = Prisma.UserGetPayload<{ select: typeof SESSION_SELECT }>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ token?: string; body: Record<string, unknown> }> {
    const email = normalizeEmail(dto.email);
    const isIntern = dto.role === Role.INTERN;

    if (isIntern && dto.workEmail != null) {
      throw validationError(['workEmail is only allowed for STAFF accounts']);
    }
    if (!isIntern && dto.phone != null) {
      throw validationError(['phone is only allowed for INTERN accounts']);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    try {
      if (isIntern) {
        const created = await this.prisma.user.create({
          data: {
            email,
            passwordHash,
            role: Role.INTERN,
            status: UserStatus.ACTIVE,
            internProfile: {
              create: { fullName: dto.fullName, phone: dto.phone ?? null },
            },
          },
          select: SESSION_SELECT,
        });
        const { user, profile } = this.toSession(created);
        return {
          token: await this.signToken(created.id, created.role),
          body: { user, profile },
        };
      }

      await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          role: Role.STAFF,
          status: UserStatus.PENDING_APPROVAL,
          staffProfile: {
            create: {
              fullName: dto.fullName,
              workEmail: dto.workEmail ?? email,
              permissions: [],
            },
          },
        },
        select: { id: true },
      });
      return {
        body: {
          message: 'Your account was created and is waiting for approval.',
        },
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'EMAIL_TAKEN',
          message: 'This email is already registered.',
        });
      }
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, status: true, passwordHash: true },
    });

    const passwordOk = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordOk || user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: "That email or password doesn't match our records.",
      });
    }
    if (user.status === UserStatus.PENDING_APPROVAL) {
      throw new ForbiddenException({
        code: 'ACCOUNT_PENDING',
        message: 'Your account is waiting for approval.',
      });
    }

    return {
      token: await this.signToken(user.id, user.role),
      body: await this.getSession(user.id),
    };
  }

  async getSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SESSION_SELECT,
    });
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Please sign in to continue.',
      });
    }
    return this.toSession(user);
  }

  private toSession(u: SessionUser) {
    const profile =
      u.internProfile ??
      (u.staffProfile
        ? {
            id: u.staffProfile.id,
            fullName: u.staffProfile.fullName,
            workEmail: u.staffProfile.workEmail,
          }
        : null);

    return {
      user: { id: u.id, email: u.email, role: u.role, status: u.status },
      profile,
      permissions: u.staffProfile?.permissions ?? [],
    };
  }

  private signToken(userId: string, role: Role) {
    return this.jwt.signAsync({ sub: userId, role });
  }
}