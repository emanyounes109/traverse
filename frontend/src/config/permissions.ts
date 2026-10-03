import type { Permission } from "@/types/api";

export const PERMISSION_INFO: Record<Permission, { label: string; description: string }> = {
  CAN_MANAGE_USERS: {
    label: "Manage staff",
    description: "Approve new staff and edit what each person can do.",
  },
  CAN_MANAGE_PROGRAMS: {
    label: "Manage programs",
    description: "Create programs and move them through their lifecycle.",
  },
  CAN_REVIEW_APPLICATIONS: {
    label: "Review applications",
    description: "Review applicants, shortlist, accept or reject.",
  },
  CAN_MANAGE_INTERVIEWS: {
    label: "Manage interviews",
    description: "Schedule, reschedule, complete and cancel interviews.",
  },
  CAN_ASSIGN_MENTOR: {
    label: "Assign mentors",
    description: "Assign mentors to internships.",
  },
  CAN_MANAGE_TASKS: {
    label: "Manage tasks",
    description: "Create and edit tasks for interns.",
  },
  CAN_REVIEW_TASKS: {
    label: "Review tasks",
    description: "Review submissions and give feedback.",
  },
  CAN_CHANGE_INTERNSHIP_STATUS: {
    label: "Change internship status",
    description: "Move internships forward and upload internship documents.",
  },
  CAN_VIEW_ALL_INTERNS: {
    label: "View all interns",
    description: "See every intern, not only the ones you mentor.",
  },
  CAN_VIEW_AUDIT: {
    label: "View audit history",
    description: "See the change history of records.",
  },
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_INFO) as Permission[];