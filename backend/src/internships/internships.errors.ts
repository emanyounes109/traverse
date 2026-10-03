import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export const notFound = (message: string) =>
  new NotFoundException({ code: 'NOT_FOUND', message });

export const forbidden = () =>
  new ForbiddenException({
    code: 'FORBIDDEN',
    message: "You don't have permission to do that.",
  });

export const conflict = (code: string, message: string) =>
  new ConflictException({ code, message });

export const badRequest = (code: string, message: string) =>
  new BadRequestException({ code, message });