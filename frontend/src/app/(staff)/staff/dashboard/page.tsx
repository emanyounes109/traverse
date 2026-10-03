"use client";

import Link from "next/link";
import { CalendarClock, Loader2, ShieldAlert, Users } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format-datetime";
import { deadlineParts, firstNameOf, greeting, initialsOf, pad2 } from "@/lib/dashboard-utils";
import {
  DASH_APPLICATION_BAR,
  DASH_APPLICATION_LABEL,
  DASH_APPLICATION_STATUSES,
  DASH_INTERNSHIP_STATUS_LABEL,
  DASH_INTERNSHIP_STATUS_TONE,
  DASH_INTERVIEW_STATUS_LABEL,
  DASH_INTERVIEW_STATUS_TONE,
} from "@/config/dashboard";
import { useStaffDashboard } from "@/hooks/use-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StateMessage } from "@/components/ui/state-message";
import { buttonStyles } from "@/components/ui/button";
import { SectionTitle } from "@/components/dashboard/section-title";
import { MeterBar } from "@/components/dashboard/meter-bar";
import { Donut } from "@/components/dashboard/donut";

export default function StaffDashboardPage() {
  const { me, hasPermission } = useAuth();
  const { data, isLoading, error } = useStaffDashboard();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="Could not load the dashboard"
          description={error instanceof ApiError ? error.message : undefined}
        />
      </Card>
    );
  }

  const name = firstNameOf(me);
  const { interns, applicationsByStatus, upcomingInterviews, mentorWorkload, tasks, internProgress } = data;

  const activeShare = interns.total > 0 ? Math.min(100, Math.round((interns.active / interns.total) * 100)) : 0;

  const applicationTotal = applicationsByStatus
    ? DASH_APPLICATION_STATUSES.reduce((sum, key) => sum + applicationsByStatus[key], 0)
    : 0;

  const byStatus = tasks.byStatus;
  const taskRows = [
    { label: "Approved", value: byStatus.APPROVED, dot: "bg-success" },
    { label: "In progress", value: byStatus.IN_PROGRESS, dot: "bg-accent" },
    { label: "Needs review", value: byStatus.SUBMITTED + byStatus.UNDER_REVIEW, dot: "bg-steel" },
    { label: "Changes requested", value: byStatus.CHANGES_REQUESTED, dot: "bg-danger" },
    { label: "Pending", value: byStatus.PENDING, dot: "bg-line" },
  ];

  // Busiest mentors first
  const topMentors = mentorWorkload
    ? [...mentorWorkload].sort((a, b) => b.activeInternCount - a.activeInternCount).slice(0, 5)
    : null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Program overview"
        title={`${greeting()}${name ? `, ${name}` : ""}`}
        subtitle="A clear view of your people, programs, and what needs attention."
        aside={
          hasPermission("CAN_MANAGE_PROGRAMS") ? (
            <Link href="/staff/programs/new" className={buttonStyles("accent", true)}>
              New program
            </Link>
          ) : null
        }
      />

      {/* Numbers */}
      <div className="grid overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[11px] text-muted">Your scope</p>
          <p className="mt-1 font-heading text-xl font-bold text-ink">People in progress.</p>
          <p className="mt-2 text-xs text-muted">Numbers cover the interns you can see.</p>
        </div>
        <div className="border-b border-line p-5 sm:border-l-0 lg:border-b-0 lg:border-r">
          <p className="text-xs text-muted">Total interns</p>
          <p className="mt-1 font-heading text-4xl font-bold text-ink">{interns.total}</p>
        </div>
        <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs text-muted">Active now</p>
          <p className="mt-1 font-heading text-4xl font-bold text-ink">{interns.active}</p>
          <p className="mt-1 text-xs text-muted">{activeShare}% of all interns</p>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted">Completed</p>
          <p className="mt-1 font-heading text-4xl font-bold text-ink">{interns.completed}</p>
        </div>
      </div>

      {/* Needs attention */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/staff/tasks">
          <Card className="transition hover:border-ink/30">
            <p className="text-xs text-muted">Overdue tasks</p>
            <p
              className={`mt-1 font-heading text-3xl font-bold ${
                data.overdueTasks > 0 ? "text-danger" : "text-ink"
              }`}
            >
              {pad2(data.overdueTasks)}
            </p>
            <p className="mt-1 text-xs text-muted">Past the deadline and not approved yet.</p>
          </Card>
        </Link>
        <Link href="/staff/mentors">
          <Card className="transition hover:border-ink/30">
            <p className="text-xs text-muted">Interns without a mentor</p>
            <p
              className={`mt-1 font-heading text-3xl font-bold ${
                data.unassignedInterns > 0 ? "text-accent" : "text-ink"
              }`}
            >
              {pad2(data.unassignedInterns)}
            </p>
            <p className="mt-1 text-xs text-muted">Open internships that still need a mentor.</p>
          </Card>
        </Link>
      </div>

      {/* Pipeline and tasks */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {applicationsByStatus && (
          <section>
            <SectionTitle title="Application pipeline" href="/staff/applications" linkLabel="View applications" />
            <Card>
              <p className="font-heading text-4xl font-bold text-ink">
                {applicationTotal}{" "}
                <span className="text-sm font-normal text-muted">total applications</span>
              </p>

              <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-line">
                {DASH_APPLICATION_STATUSES.filter((s) => applicationsByStatus[s] > 0).map((status) => (
                  <div
                    key={status}
                    className={DASH_APPLICATION_BAR[status]}
                    style={{ width: `${(applicationsByStatus[status] / applicationTotal) * 100}%` }}
                    title={`${DASH_APPLICATION_LABEL[status]}: ${applicationsByStatus[status]}`}
                  />
                ))}
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {DASH_APPLICATION_STATUSES.map((status) => (
                  <li key={status} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${DASH_APPLICATION_BAR[status]}`} />
                    <span className="text-muted">{DASH_APPLICATION_LABEL[status]}</span>
                    <span className="font-semibold text-ink">{applicationsByStatus[status]}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        <section className={applicationsByStatus ? "" : "lg:col-span-2"}>
          <SectionTitle title="Task completion" href="/staff/tasks" linkLabel="View tasks" />
          <Card>
            <div className="flex items-center gap-5">
              <Donut percent={tasks.completionRate} />
              <ul className="min-w-0 flex-1 space-y-2">
                {taskRows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-muted">
                      <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                      {row.label}
                    </span>
                    <span className="font-semibold text-ink">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-xs text-muted">{tasks.total} tasks in total</p>
          </Card>
        </section>
      </div>

      {/* Interviews and mentors */}
      {(upcomingInterviews || topMentors) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {upcomingInterviews && (
            <section>
              <SectionTitle title="Upcoming interviews" href="/staff/interviews" linkLabel="View schedule" />
              <Card padding="none">
                {upcomingInterviews.length === 0 ? (
                  <StateMessage
                    icon={CalendarClock}
                    title="No upcoming interviews"
                    description="Scheduled interviews will appear here."
                  />
                ) : (
                  <ul>
                    {upcomingInterviews.map((interview) => {
                      const parts = deadlineParts(interview.scheduledAt);
                      return (
                        <li
                          key={interview.id}
                          className="flex items-center gap-3 border-b border-line p-3 last:border-b-0"
                        >
                          <div className="w-11 shrink-0 text-center">
                            <p className="font-heading text-xl font-bold leading-none text-ink">{parts.day}</p>
                            <p className="font-mono text-[10px] uppercase text-muted">{parts.month}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">
                              {interview.applicant.fullName ?? "Applicant"}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {interview.program.name} · {formatDateTime(interview.scheduledAt)}
                            </p>
                          </div>
                          <Badge tone={DASH_INTERVIEW_STATUS_TONE[interview.status]}>
                            {DASH_INTERVIEW_STATUS_LABEL[interview.status]}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </section>
          )}

          {topMentors && (
            <section>
              <SectionTitle title="Mentor workload" href="/staff/mentors" linkLabel="See all mentors" />
              <Card>
                {topMentors.length === 0 ? (
                  <p className="text-sm text-muted">No active staff yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {topMentors.map((mentor) => (
                      <li key={mentor.id}>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                          <span className="truncate text-ink">{mentor.fullName}</span>
                          <span className="flex items-center gap-2">
                            {mentor.atCapacity && <Badge tone="danger">Full</Badge>}
                            <span className="font-mono text-xs text-muted">
                              {mentor.activeInternCount} / {mentor.maxInterns} interns
                            </span>
                          </span>
                        </div>
                        <MeterBar
                          value={mentor.activeInternCount}
                          max={mentor.maxInterns}
                          tone={mentor.atCapacity ? "danger" : "primary"}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          )}
        </div>
      )}

      {/* Intern progress */}
      <section>
        <SectionTitle title="Intern progress" href="/staff/interns" linkLabel="View all interns" />
        <Card padding="none">
          {internProgress.length === 0 ? (
            <StateMessage
              icon={Users}
              title="No interns in onboarding or active yet"
              description="Interns appear here once their internship starts."
            />
          ) : (
            <>
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)] gap-3 border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
                <span>Intern</span>
                <span>Status</span>
                <span>Progress</span>
              </div>
              <ul>
                {internProgress.map((row) => (
                  <li key={row.internshipId} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/staff/interns/${row.internId}`}
                      className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)] items-center gap-3 px-4 py-3 transition hover:bg-canvas"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-ink">
                          {initialsOf(row.fullName)}
                        </span>
                        <span className="truncate text-sm font-semibold text-ink">
                          {row.fullName ?? "Intern"}
                        </span>
                      </span>
                      <span>
                        <Badge tone={DASH_INTERNSHIP_STATUS_TONE[row.status]} dot>
                          {DASH_INTERNSHIP_STATUS_LABEL[row.status]}
                        </Badge>
                      </span>
                      <span className="flex items-center gap-2">
                        <MeterBar value={row.progressPercent} />
                        <span className="w-10 shrink-0 text-right font-mono text-xs text-muted">
                          {row.progressPercent}%
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}