export const AUDIT_ENTITY_TYPES = [
  'application',
  'interview',
  'internship',
  'task',
  'mentor-assignments',
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];