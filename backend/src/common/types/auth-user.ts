import type { Permission, Role } from '@prisma/client';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  role: Role;
  permissions: Permission[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}