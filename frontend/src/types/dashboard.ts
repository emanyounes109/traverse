export type DashTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export type DashTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type DashInternshipStatus =
  | "ACCEPTED"
  | "ONBOARDING"
  | "ACTIVE"
  | "COMPLETED"
  | "DROPPED";

export type DashApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "ACCEPTED"
  | "REJECTED";

export type DashInterviewStatus = "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED";

export type TaskCounts = Record<DashTaskStatus, number>;
export type ApplicationCounts = Record<DashApplicationStatus, number>;

export interface PersonRef {
  id: string;
  fullName: string | null;
}

// GET /dashboard/intern
export interface InternDashboard {
  internship: {
    id: string;
    status: DashInternshipStatus;
    startedAt: string | null;
    program: { id: string; name: string };
  } | null;
  progressPercent: number;
  taskCounts: TaskCounts;
  upcomingDeadlines: {
    id: string;
    title: string;
    deadline: string;
    priority: DashTaskPriority;
    status: DashTaskStatus;
  }[];
  recentFeedback: {
    id: string;
    taskId: string;
    taskTitle: string;
    comment: string;
    staff: PersonRef;
    createdAt: string;
  }[];
  currentMentor: { id: string; fullName: string | null; workEmail: string | null } | null;
  nextInterview: {
    id: string;
    scheduledAt: string;
    status: DashInterviewStatus;
    interviewer: PersonRef;
    program: { id: string; name: string };
  } | null;
}

export interface DashWorkloadItem {
  id: string;
  fullName: string;
  workEmail: string;
  activeInternCount: number;
  maxInterns: number;
  atCapacity: boolean;
}

// GET /dashboard/staff (a null section means the permission is missing)
export interface StaffDashboard {
  interns: { total: number; active: number; completed: number };
  applicationsByStatus: ApplicationCounts | null;
  upcomingInterviews:
    | {
        id: string;
        scheduledAt: string;
        status: DashInterviewStatus;
        interviewer: PersonRef;
        applicant: PersonRef;
        program: { id: string; name: string };
      }[]
    | null;
  mentorWorkload: DashWorkloadItem[] | null;
  tasks: { byStatus: TaskCounts; total: number; completionRate: number };
  internProgress: {
    internId: string;
    fullName: string | null;
    internshipId: string;
    status: DashInternshipStatus;
    progressPercent: number;
  }[];
  overdueTasks: number;
  unassignedInterns: number;
}