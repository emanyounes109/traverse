import type { Permission, UserStatus } from "./api";

// Item returned by GET /staff (used for pickers)
export interface StaffMember {
  id: string;
  fullName: string;
  workEmail: string;
}

// Item returned by GET /staff when the caller has CAN_MANAGE_USERS
export interface ManagedStaff extends StaffMember {
  status: UserStatus;
  permissions: Permission[];
}

// Item returned by GET /staff/pending
export interface PendingStaff {
  id: string;
  email: string;
  fullName: string;
  workEmail: string;
  createdAt: string;
}