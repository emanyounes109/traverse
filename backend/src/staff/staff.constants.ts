import { Permission, UserStatus } from '@prisma/client';

export const USER_STATUS_TRANSITIONS: Record<UserStatus, readonly UserStatus[]> =
  {
    [UserStatus.PENDING_APPROVAL]: [UserStatus.ACTIVE, UserStatus.DISABLED],
    [UserStatus.ACTIVE]: [],
    [UserStatus.DISABLED]: [],
  };

export const PERMISSION_ORDER: readonly Permission[] = Object.values(Permission);

export const USERS_ADVISORY_LOCK = 'traverse:staff:users-lock';