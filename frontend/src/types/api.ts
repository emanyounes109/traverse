export type Role = "INTERN" | "STAFF";
export type UserStatus = "ACTIVE" | "PENDING_APPROVAL" | "DISABLED";

export type Permission =
  | "CAN_MANAGE_USERS"
  | "CAN_MANAGE_PROGRAMS"
  | "CAN_REVIEW_APPLICATIONS"
  | "CAN_MANAGE_INTERVIEWS"
  | "CAN_ASSIGN_MENTOR"
  | "CAN_MANAGE_TASKS"
  | "CAN_REVIEW_TASKS"
  | "CAN_CHANGE_INTERNSHIP_STATUS"
  | "CAN_VIEW_ALL_INTERNS"
  | "CAN_VIEW_AUDIT";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
}

export interface InternProfile {
  id: string;
  fullName: string;
  phone: string | null;
  contactInfo: string | null;
  cvDocumentId: string | null;
}

export interface StaffProfile {
  id: string;
  fullName: string;
  workEmail: string;
}

export interface Me {
  user: AuthUser;
  profile: InternProfile | StaffProfile;
  permissions: Permission[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

/* ---------- Programs ---------- */

export type ProgramStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ARCHIVED";

export type ProgramAction = "publish" | "close" | "start" | "complete" | "archive";

export interface Program {
  id: string;
  name: string;
  description: string;
  requirements: string;
  applicationOpenDate: string;
  applicationCloseDate: string;
  internshipStartDate: string;
  internshipEndDate: string;
  capacity: number;
  status: ProgramStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  acceptedCount: number;
  seatsLeft: number;
}

// Body for POST /programs (dates are ISO strings with timezone)
export interface ProgramInput {
  name: string;
  description: string;
  requirements: string;
  applicationOpenDate: string;
  applicationCloseDate: string;
  internshipStartDate: string;
  internshipEndDate: string;
  capacity: number;
}

// Body for PATCH /programs/:id (at least one field)
export type ProgramUpdate = Partial<ProgramInput>;