import type { InternshipStatus } from "./internships";

// Item returned by GET /interns
export interface InternListItem {
  internId: string;
  fullName: string;
  email: string;
  internshipId: string;
  status: InternshipStatus;
  program: { id: string; name: string };
  mentor: { id: string; fullName: string } | null;
  progress: number;
}

export interface InternshipDetail {
  id: string;
  internId: string;
  programId: string;
  applicationId: string;
  status: InternshipStatus;
  startedAt: string | null;
  endedAt: string | null;
  dropReason: string | null;
  createdAt: string;
  updatedAt: string;
  program: { id: string; name: string };
  intern: { id: string; fullName: string; email: string };
  mentor: { id: string; fullName: string; workEmail: string } | null;
  progress: number;
  taskCounts: { total: number; approved: number };
}

// GET /interns/:id (the id is the intern USER id)
export interface InternDetail {
  profile: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    contactInfo: string | null;
    cvDocumentId: string | null;
  };
  internships: InternshipDetail[];
  currentMentor: { id: string; fullName: string; workEmail: string } | null;
  progress: number;
  taskCounts: { total: number; approved: number };
}

export interface InternshipHistoryEntry {
  id: string;
  fromStatus: InternshipStatus | null;
  toStatus: InternshipStatus;
  note: string | null;
  createdAt: string;
  changedBy: { id: string; fullName: string };
}

// Item returned by GET /staff/workload
export interface MentorWorkload {
  id: string;
  fullName: string;
  workEmail: string;
  activeInternCount: number;
  maxInterns: number;
  atCapacity: boolean;
}