import type { ApplicationStatus, InterviewResult, InterviewStatus } from "./applications";

// Item returned by GET /interviews
export interface InterviewListItem {
  id: string;
  status: InterviewStatus;
  result: InterviewResult | null;
  scheduledAt: string;
  interviewer: { id: string; fullName: string };
  application: { id: string; status: ApplicationStatus };
  applicant: { id: string; fullName: string };
  program: { id: string; name: string };
}