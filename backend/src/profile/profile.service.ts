import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { validationError } from '../common/utils/errors';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
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
          select: { id: true, fullName: true, workEmail: true },
        },
      },
    });

    if (user?.role === Role.INTERN && user.internProfile) {
      const p = user.internProfile;
      return {
        id: p.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: p.fullName,
        phone: p.phone,
        contactInfo: p.contactInfo,
        cvDocumentId: p.cvDocumentId,
      };
    }

    if (user?.role === Role.STAFF && user.staffProfile) {
      const p = user.staffProfile;
      return {
        id: p.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: p.fullName,
        workEmail: p.workEmail,
      };
    }

    throw new NotFoundException({
      code: 'PROFILE_NOT_FOUND',
      message: 'Profile not found.',
    });
  }

  async updateMe(userId: string, role: Role, dto: UpdateProfileDto) {
    const hasAny = Object.values(dto).some((v) => v !== undefined);
    if (!hasAny) {
      throw validationError(['at least one field must be provided']);
    }

    if (role === Role.INTERN) {
      if (dto.workEmail !== undefined) {
        throw validationError(['workEmail is not allowed for INTERN accounts']);
      }
      await this.prisma.internProfile.update({
        where: { userId },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          contactInfo: dto.contactInfo,
        },
      });
    } else {
      if (dto.phone !== undefined || dto.contactInfo !== undefined) {
        throw validationError([
          'phone and contactInfo are not allowed for STAFF accounts',
        ]);
      }
      await this.prisma.staffProfile.update({
        where: { userId },
        data: { fullName: dto.fullName, workEmail: dto.workEmail },
      });
    }

    return this.getMe(userId);
  }
}