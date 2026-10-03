"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { formatDateTime } from "@/lib/format-datetime";
import { APPLICATION_STATUS_LABEL, APPLICATION_STEPS, applicationStep } from "@/config/application-flow";
import { INTERN_APPLICATION_COPY } from "@/config/intern-application-copy";
import { INTERVIEW_STATUS_LABEL } from "@/config/interview-flow";
import { useMyApplication } from "@/hooks/use-intern-applications";
import { useMyInternship } from "@/hooks/use-profile";
import { useProgram } from "@/hooks/use-programs";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Timeline } from "@/components/ui/timeline";
import { InfoItem } from "@/components/ui/info-item";
import { StateMessage } from "@/components/ui/state-message";
import { buttonStyles } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";

export default function MyApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: app, isLoading, error } = useMyApplication(id);
  const accepted = app?.status === "ACCEPTED";
  const internship = useMyInternship(accepted);
  const { data: program } = useProgram(accepted ? (app?.programId ?? "") : "");

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <Card padding="none">
        <StateMessage
          icon={SearchX}
          title="Application not found"
          description={error instanceof ApiError ? error.message : undefined}
          action={
            <Link href="/intern/applications" className={buttonStyles("outline", true)}>
              Back to my applications
            </Link>
          }
        />
      </Card>
    );
  }

  const copy = INTERN_APPLICATION_COPY[app.status];
  const step = applicationStep(app.status, app.history);
  const interviews = app.interviews ?? [];

  const acceptedEntry = app.history.find((h) => h.toStatus === "ACCEPTED");
  const body =
    accepted && acceptedEntry
      ? `${copy.body} It was accepted on ${formatDate(acceptedEntry.createdAt)}.`
      : copy.body;

  // Newest first
  const timelineItems = [...app.history].reverse().map((h) => ({
    id: h.id,
    date: formatDate(h.createdAt),
    title: h.fromStatus
      ? `Your application moved to ${APPLICATION_STATUS_LABEL[h.toStatus]}.`
      : "Application received.",
  }));

  return (
    <div className="space-y-4">
      <Link
        href="/intern/applications"
        className="inline-flex items-center gap-1 text-xs font-semibold text-ink transition hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to my applications
      </Link>

      <PageHeader
        eyebrow={`My application / #${app.id.slice(0, 8)}`}
        title="Your application"
        subtitle="The steps that brought you here, all in one place."
        aside={<ApplicationStatusBadge status={app.status} />}
      />

      <Card>
        <CardHeader
          eyebrow={app.program.name}
          title={copy.headline}
          meta={`Applied ${formatDate(app.appliedAt)}`}
        />
        <Stepper steps={APPLICATION_STEPS} current={step.current} currentTone={step.tone} />
        <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-muted">{body}</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {accepted && (
            <Card>
              <CardHeader title="Your placement" divider />
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Program">{app.program.name}</InfoItem>
                <InfoItem label="Placement dates">
                  {program
                    ? `${formatDate(program.internshipStartDate)} – ${formatDate(program.internshipEndDate)}`
                    : "..."}
                </InfoItem>
                <InfoItem label="Your mentor">
                  {internship.data ? (internship.data.mentor?.fullName ?? "Not assigned yet") : "..."}
                </InfoItem>
              </dl>
            </Card>
          )}

          {interviews.length > 0 && (
            <Card>
              <CardHeader title="Your interviews" divider />
              <ul>
                {interviews.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between border-b border-line py-2 text-sm first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <span className="text-ink">{formatDateTime(i.scheduledAt)}</span>
                    <span className="text-xs text-muted">{INTERVIEW_STATUS_LABEL[i.status]}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader title="Application history" />
            <Timeline items={timelineItems} />
          </Card>
        </div>

        <Card className="self-start border-transparent bg-[#e9efec]">
          <p className="font-mono text-[11px] text-muted">What happens next</p>
          <p className="mt-2 font-heading text-lg font-bold leading-snug text-ink">{copy.headline}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{copy.next}</p>
        </Card>
      </div>
    </div>
  );
}