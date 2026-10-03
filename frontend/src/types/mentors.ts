import type { DashInternshipStatus } from "./dashboard";

// GET /staff/workload (plain array)
export interface MentorWorkloadItem {
  id: string;
  fullName: string;
  workEmail: string;
  activeInternCount: number;
  maxInterns: number;
  atCapacity: boolean;
}

// Item of GET /interns used by the mentor page
export interface MentorableIntern {
  internId: string;
  fullName: string | null;
  email: string;
  internshipId: string;
  status: DashInternshipStatus;
  program: { id: string; name: string };
  mentor: { id: string; fullName: string | null } | null;
  progress: number;
}

// GET /interns/:id/mentor-history (plain array, newest first)
export interface MentorHistoryEntry {
  id: string;
  internshipId: string;
  mentor: { id: string; fullName: string | null };
  assignedBy: { id: string; fullName: string | null };
  assignedAt: string;
  endedAt: string | null;
}

// POST /internships/:id/mentor
export interface AssignMentorResult {
  id: string;
  internshipId: string;
  staffId: string;
  assignedAt: string;
  endedAt: string | null;
  warning?: "MENTOR_AT_CAPACITY";
}