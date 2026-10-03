"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, SearchX, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { formatDateTime } from "@/lib/format-datetime";
import {
  APPLICATION_NEXT_STEP,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STEPS,
  applicationStep,
} from "@/config/application-flow";
import type { StatusAction } from "@/config/application-flow";
import { INTERVIEW_RESULT_LABEL, INTERVIEW_STATUS_LABEL } from "@/config/interview-flow";
import { useApplication } from "@/hooks/use-applications";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Timeline } from "@/components/ui/timeline";
import { InfoItem } from "@/components/ui/info-item";
import { StateMessage } from "@/components/ui/state-message";
import { DocumentRow } from "@/components/documents/document-row";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { ApplicationStatusDialog } from "@/components/applications/application-status-dialog";
import { ScheduleInterviewDialog } from "@/components/applications/schedule-interview-dialog";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canReview = hasPermission("CAN_REVIEW_APPLICATIONS");
  const canInterview = hasPermission("CAN_MANAGE_INTERVIEWS");
  const canAudit = hasPermission("CAN_VIEW_AUDIT");

  const { data: app, isLoading, error } = useApplication(id, canReview);

  // The status change waiting for confirmation
  const [action, setAction] = useState<StatusAction | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (!canReview) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to review applications."
        />
      </Card>
    );
  }

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
        />
      </Card>
    );
  }

  const step = applicationStep(app.status, app.history);
  const nextStep = APPLICATION_NEXT_STEP[app.status];
  const interviews = app.interviews ?? [];
  const canSchedule = canInterview && (app.status === "SHORTLISTED" || app.status === "INTERVIEW");

  // Newest first for display (staff also see the internal notes, such as rejection reasons)
  const timelineItems = [...app.history].reverse().map((h) => ({
    id: h.id,
    date: formatDate(h.createdAt),
    title: h.fromStatus
      ? `Moved from ${APPLICATION_STATUS_LABEL[h.fromStatus]} to ${APPLICATION_STATUS_LABEL[h.toStatus]}.`
      : "Application received.",
    note: h.note,
  }));

  const handleDone = (done: StatusAction) => {
    if (done.toStatus === "ACCEPTED") {
      setNotice("Applicant accepted. An internship has been created for them.");
    } else if (done.toStatus === "REJECTED") {
      setNotice("The application was rejected and the reason was recorded.");
    } else {
      setNotice(null);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/staff/applications"
        className="inline-flex items-center gap-1 text-xs font-semibold text-ink transition hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all applications
      </Link>

      <PageHeader
        eyebrow={`Applications / #${app.id.slice(0, 8)}`}
        title={app.intern.fullName}
        subtitle={`Application for the ${app.program.name} program.`}
        aside={<ApplicationStatusBadge status={app.status} />}
      />

      {notice && <Alert variant="success">{notice}</Alert>}

      <Card>
        <CardHeader
          eyebrow="Application journey"
          title="A clear path through the process"
          meta={`Applied ${formatDate(app.appliedAt)}`}
        />
        <Stepper steps={APPLICATION_STEPS} current={step.current} currentTone={step.tone} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Applicant information" divider />
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Full name">{app.intern.fullName}</InfoItem>
              <InfoItem label="Email address">
                <a
                  href={`mailto:${app.intern.email}`}
                  className="underline decoration-steel/40 underline-offset-4"
                >
                  {app.intern.email}
                </a>
              </InfoItem>
              <InfoItem label="Program">{app.program.name}</InfoItem>
              <InfoItem label="Applied on">{formatDate(app.appliedAt)}</InfoItem>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Documents" divider />
            {app.intern.cvDocumentId ? (
              <DocumentRow documentId={app.intern.cvDocumentId} title="Curriculum vitae" />
            ) : (
              <p className="text-sm text-muted">This applicant has not uploaded a CV.</p>
            )}
          </Card>

          {interviews.length > 0 && (
            <Card>
              <CardHeader title="Interviews" divider />
              <ul>
                {interviews.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between border-b border-line py-2 text-sm first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <span className="text-ink">{formatDateTime(i.scheduledAt)}</span>
                    <span className="text-xs text-muted">
                      {INTERVIEW_STATUS_LABEL[i.status]}
                      {i.result ? ` · ${INTERVIEW_RESULT_LABEL[i.result]}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader title="Next step" />
            {nextStep ? (
              <>
                <p className="text-sm text-muted">{nextStep.text}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {nextStep.actions.map((a) => (
                    <Button key={a.toStatus} compact variant={a.variant} onClick={() => setAction(a)}>
                      {a.label}
                    </Button>
                  ))}

                  {canSchedule && (
                    <Button
                      compact
                      variant={app.status === "SHORTLISTED" ? "accent" : "outline"}
                      onClick={() => setScheduleOpen(true)}
                    >
                      {app.status === "SHORTLISTED" ? "Schedule interview" : "Schedule another interview"}
                    </Button>
                  )}
                </div>

                {app.status === "SHORTLISTED" && !canInterview && (
                  <p className="mt-3 text-xs text-muted">
                    You need interview permissions to schedule an interview.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">
                This application is final. No further action is needed.
              </p>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader
              title="Application history"
              meta={
                canAudit ? (
                  <Link
                    href={`/staff/audit?type=application&id=${app.id}`}
                    className="font-sans text-xs font-semibold text-ink underline underline-offset-4"
                  >
                    Full audit
                  </Link>
                ) : undefined
              }
            />
            <Timeline items={timelineItems} />
          </Card>
        </div>
      </div>

      {action && (
        <ApplicationStatusDialog
          key={action.toStatus}
          applicationId={app.id}
          action={action}
          onClose={() => setAction(null)}
          onDone={handleDone}
        />
      )}

      <ScheduleInterviewDialog
        applicationId={app.id}
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
    </div>
  );
}