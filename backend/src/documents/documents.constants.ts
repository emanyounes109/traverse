import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const DOCUMENT_SELECT = {
  id: true,
  type: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  version: true,
  groupId: true,
  isCurrent: true,
  internId: true,
  uploadedById: true,
  createdAt: true,
} satisfies Prisma.DocumentSelect;

export const DOCUMENT_ACCESS_SELECT = {
  ...DOCUMENT_SELECT,
  ownerId: true,
} satisfies Prisma.DocumentSelect;

export function toPublicDocument<T extends { ownerId?: string }>(
  doc: T,
): Omit<T, 'ownerId'> {
  const { ownerId: _ownerId, ...rest } = doc;
  return rest;
}

export const forbidden = () =>
  new ForbiddenException({
    code: 'FORBIDDEN',
    message: "You don't have permission to do that.",
  });

export const documentNotFound = () =>
  new NotFoundException({
    code: 'NOT_FOUND',
    message: 'Document not found.',
  });