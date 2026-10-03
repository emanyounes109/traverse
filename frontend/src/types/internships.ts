export type InternshipStatus = "ACCEPTED" | "ONBOARDING" | "ACTIVE" | "COMPLETED" | "DROPPED";

// Internship detail returned by GET /internships/me
export interface InternshipSummary {
  id: string;
  internId: string;
  programId: string;
  applicationId: string;
  status: InternshipStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  program: { id: string; name: string };
  mentor: { id: string; fullName: string; workEmail: string } | null;
  progress: number;
}