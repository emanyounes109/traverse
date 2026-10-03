import type { ProgramStatus } from "./api";

export type ApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "ACCEPTED"
  | "REJECTED";

// Intern view: GET /applications/me
export interface Application {
  id: string;
  internId: string;
  programId: string;
  status: ApplicationStatus;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
  program: { id: string; name: string; status: ProgramStatus };
}

// Staff list item: GET /applications
export interface ApplicationListItem {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  program: { id: string; name: string };
  applicant: { id: string; fullName: string; email: string };
}

export interface ApplicationHistoryEntry {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  // Internal note: only returned to staff
  note?: string | null;
  changedById: string;
  createdAt: string;
}

export type InterviewStatus = "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED";
export type InterviewResult = "PASSED" | "FAILED" | "NEEDS_ANOTHER_ROUND";

export interface InterviewSummary {
  id: string;
  applicationId: string;
  interviewerId: string;
  scheduledAt: string;
  status: InterviewStatus;
  result: InterviewResult | null;
  notes?: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /applications/:id
export interface ApplicationDetail extends Application {
  intern: { id: string; fullName: string; email: string; cvDocumentId: string | null };
  history: ApplicationHistoryEntry[];
  interviews: InterviewSummary[];
}