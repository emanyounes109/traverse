"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Briefcase, CalendarClock, Loader2, Mail, Quote, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { formatDateTime } from "@/lib/format-datetime";
import {
  deadlineParts,
  dueLabel,
  firstNameOf,
  greeting,
  initialsOf,
  pad2,
} from "@/lib/dashboard-utils";
import {
  DASH_INTERNSHIP_STATUS_LABEL,
  DASH_INTERNSHIP_STATUS_TONE,
  DASH_INTERNSHIP_STEPS,
  DASH_INTERVIEW_STATUS_LABEL,
  DASH_INTERVIEW_STATUS_TONE,
  DASH_PRIORITY_LABEL,
  DASH_TASK_LABEL,
  DASH_TASK_NUMBER_TONE,
  DASH_TASK_STATUSES,
  internshipStepIndex,
} from "@/config/dashboard";
import { useInternDashboard } from "@/hooks/use-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Stepper } from "@/components/ui/stepper";
import { StateMessage } from "@/components/ui/state-message";
import { buttonStyles } from "@/components/ui/button";
import { SectionTitle } from "@/components/dashboard/section-title";
import { MeterBar } from "@/components/dashboard/meter-bar";

export default function InternDashboardPage() {
  const { me } = useAuth();
  const { data, isLoading, error } = useInternDashboard();
  const [showEarlier, setShowEarlier] = useState(false);

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
          title="Could not load your dashboard"
          description={error instanceof ApiError ? error.message : undefined}
        />
      </Card>
    );
  }

  const name = firstNameOf(me);
  const { internship, taskCounts, currentMentor, nextInterview } = data;
  const totalTasks = DASH_TASK_STATUSES.reduce((sum, key) => sum + taskCounts[key], 0);
  const [latest, ...earlier] = data.recentFeedback;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Dashboard / Overview"
        title={`${greeting()}${name ? `, ${name}` : ""}`}
        subtitle="Here's where you stand, and what's coming up next."
      />

      {/* Placement */}
      <Card>
        {internship ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-muted">
                  Current placement / #{internship.id.slice(0, 8)}
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold leading-tight text-ink">
                  {internship.program.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {internship.startedAt
                    ? `Started ${formatDate(internship.startedAt)}`
                    : "Not started yet"}
                </p>
              </div>
              <Badge tone={DASH_INTERNSHIP_STATUS_TONE[internship.status]} dot>
                {DASH_INTERNSHIP_STATUS_LABEL[internship.status]}
              </Badge>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-3 text-sm font-semibold text-ink">Internship journey</p>
              {internship.status === "DROPPED" ? (
                <Alert>This internship was dropped. Contact your program team for details.</Alert>
              ) : (
                <Stepper
                  steps={DASH_INTERNSHIP_STEPS}
                  current={internshipStepIndex(internship.status)}
                  currentTone="accent"
                />
              )}

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">
                    {data.progressPercent}% of your tasks approved
                  </span>
                  <span className="text-muted">
                    {taskCounts.APPROVED} of {totalTasks} tasks
                  </span>
                </div>
                <MeterBar value={data.progressPercent} />
              </div>
            </div>
          </>
        ) : (
          <StateMessage
            icon={Briefcase}
            title="No internship yet"
            description="Once you are accepted into a program, your placement will appear here."
            action={
              <Link href="/intern/programs" className={buttonStyles("accent", true)}>
                Explore programs
              </Link>
            }
          />
        )}
      </Card>

      {/* Tasks at a glance */}
      <section>
        <SectionTitle title="Your tasks, at a glance" href="/intern/tasks" linkLabel="View task details" />
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-3 lg:grid-cols-6">
          {DASH_TASK_STATUSES.map((status) => (
            <div key={status} className="border-b border-r border-line p-4 last:border-r-0">
              <p className={`font-heading text-3xl font-bold ${DASH_TASK_NUMBER_TONE[status]}`}>
                {pad2(taskCounts[status])}
              </p>
              <p className="mt-1 text-xs text-muted">{DASH_TASK_LABEL[status]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deadlines and feedback */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <SectionTitle title="Upcoming deadlines" href="/intern/tasks" linkLabel="All tasks" />
          <Card padding="none">
            {data.upcomingDeadlines.length === 0 ? (
              <StateMessage
                icon={CalendarClock}
                title="No upcoming deadlines"
                description="Tasks with a due date will appear here."
              />
            ) : (
              <ul>
                {data.upcomingDeadlines.map((task) => {
                  const parts = deadlineParts(task.deadline);
                  const due = dueLabel(task.deadline);
                  return (
                    <li key={task.id} className="border-b border-line last:border-b-0">
                      <Link
                        href={`/intern/tasks/${task.id}`}
                        className="flex items-center gap-3 p-3 transition hover:bg-canvas"
                      >
                        <div className="w-11 shrink-0 text-center">
                          <p className="font-heading text-xl font-bold leading-none text-ink">{parts.day}</p>
                          <p className="font-mono text-[10px] uppercase text-muted">{parts.month}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{task.title}</p>
                          <p className="text-xs text-muted">
                            {DASH_PRIORITY_LABEL[task.priority]} · {DASH_TASK_LABEL[task.status]}
                          </p>
                        </div>
                        <Badge tone={due.urgent ? "accent" : "neutral"}>{due.text}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle title="Recent feedback" />
          {latest ? (
            <Card className="border-transparent bg-[#e9efec]">
              <div className="flex items-start justify-between gap-3">
                <Quote className="h-5 w-5 text-steel" />
                <span className="font-mono text-[11px] text-muted">{formatDate(latest.createdAt)}</span>
              </div>
              <p className="mt-2 line-clamp-4 font-heading text-base font-semibold leading-snug text-ink">
                {latest.comment}
              </p>
              <Link
                href={`/intern/tasks/${latest.taskId}`}
                className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-ink">
                    {initialsOf(latest.staff.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {latest.staff.fullName ?? "Reviewer"}
                    </p>
                    <p className="truncate text-xs text-muted">On {latest.taskTitle}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-ink" />
              </Link>

              {earlier.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowEarlier((v) => !v)}
                    className="text-xs font-semibold text-ink underline underline-offset-4"
                  >
                    {showEarlier ? "Hide earlier feedback" : `Show earlier feedback (${earlier.length})`}
                  </button>
                  {showEarlier && (
                    <ul className="mt-2 space-y-2">
                      {earlier.map((item) => (
                        <li key={item.id} className="rounded-lg bg-surface p-3">
                          <p className="line-clamp-2 text-sm text-ink">{item.comment}</p>
                          <p className="mt-1 text-xs text-muted">
                            {item.staff.fullName ?? "Reviewer"} · {item.taskTitle} ·{" "}
                            {formatDate(item.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card padding="none">
              <StateMessage
                icon={Quote}
                title="No feedback yet"
                description="Your reviewers' comments will show up here."
              />
            </Card>
          )}
        </section>
      </div>

      {/* Mentor and interview */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <SectionTitle title="Your mentor" />
          <Card>
            {currentMentor ? (
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft font-heading text-base font-bold text-ink">
                  {initialsOf(currentMentor.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{currentMentor.fullName ?? "Your mentor"}</p>
                  {currentMentor.workEmail && (
                    <p className="truncate text-sm text-muted">{currentMentor.workEmail}</p>
                  )}
                </div>
                {currentMentor.workEmail && (
                  <a href={`mailto:${currentMentor.workEmail}`} className={buttonStyles("outline", true)}>
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                A mentor has not been assigned yet. You will be notified when one is.
              </p>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle title="Next interview" href="/intern/applications" linkLabel="My applications" />
          <Card>
            {nextInterview ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{formatDateTime(nextInterview.scheduledAt)}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    With {nextInterview.interviewer.fullName ?? "the team"} · {nextInterview.program.name}
                  </p>
                </div>
                <Badge tone={DASH_INTERVIEW_STATUS_TONE[nextInterview.status]} dot>
                  {DASH_INTERVIEW_STATUS_LABEL[nextInterview.status]}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted">No interview is scheduled right now.</p>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}