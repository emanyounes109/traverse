export type AuditEntityType =
  | "application"
  | "interview"
  | "internship"
  | "task"
  | "mentor-assignments";

type PersonRef = { id: string; fullName: string } | string | null;

// The API returns slightly different fields per record type, so every field is optional
export interface AuditEntry {
  id: string;
  action?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt?: string;
  changedBy?: { id: string; fullName: string } | null;
  // Mentor assignment entries
  mentor?: PersonRef;
  assignedBy?: PersonRef;
  assignedAt?: string;
  endedAt?: string | null;
}

// Entries are ordered oldest first
export interface AuditResponse {
  entityType: AuditEntityType;
  entityId: string;
  entries: AuditEntry[];
}