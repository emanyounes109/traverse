"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { getInitials } from "@/lib/initials";
import {
  INTERNSHIP_ACTIONS,
  INTERNSHIP_STATUS_HINT,
  INTERNSHIP_STATUS_LABEL,
  INTERNSHIP_STATUS_TONE,
  INTERNSHIP_STEPS,
  internshipStep,
} from "@/config/internship-flow";
import type { InternshipAction } from "@/config/internship-flow";
import { useIntern, useInternshipHistory } from "@/hooks/use-interns";
import type { StatusChangeResult } from "@/hooks/use-interns";
import { useProgram } from "@/hooks/use-programs";
import { useDocuments, useUploadDocument } from "@/hooks/use-documents";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Stepper } from "@/components/ui/stepper";
import { Timeline } from "@/components/ui/timeline";
import { InfoItem } from "@/components/ui/info-item";
import { FileButton } from "@/components/ui/file-button";
import { StateMessage } from "@/components/ui/state-message";
import { DocumentRow } from "@/components/documents/document-row";
import { InternshipStatusDialog } from "@/components/interns/internship-status-dialog";
import { AssignMentorDialog } from "@/components/interns/assign-mentor-dialog";

export default function InternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canAssign = hasPermission("CAN_ASSIGN_MENTOR");
  const canChangeStatus = hasPermission("CAN_CHANGE_INTERNSHIP_STATUS");

  const { data, isLoading, error } = useIntern(id);

  // The most recent internship is the one shown on this page
  const internship = useMemo(
    () =>
      data
        ? [...data.internships].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        : undefined,
    [data]
  );

  const history = useInternshipHistory(internship?.id);
  const program = useProgram(internship?.programId ?? "");
  const docs = useDocuments({ type: "INTERNSHIP_DOC", internId: id, limit: 50 }, !!data);
  const upload = useUploadDocument();

  const [action, setAction] = useState<InternshipAction | null>(null);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
          icon={SearchX}
          title="Intern not found"
          description={error instanceof ApiError ? error.message : undefined}
          action={
            <Link href="/staff/interns" className={buttonStyles("outline", true)}>
              Back to all interns
            </Link>
          }
        />
      </Card>
    );
  }

  const profile = data.profile;
  const historyEntries = history.data ?? [];
  const isOpen =
    internship?.status === "ACCEPTED" ||
    internship?.status === "ONBOARDING" ||
    internship?.status === "ACTIVE";
  const actions = internship ? (INTERNSHIP_ACTIONS[internship.status] ?? []) : [];
  const step = internship ? internshipStep(internship.status, historyEntries) : null;

  // Newest first
  const timelineItems = [...historyEntries].reverse().map((h) => ({
    id: h.id,
    date: formatDate(h.createdAt),
    title: h.fromStatus
      ? `Moved from ${INTERNSHIP_STATUS_LABEL[h.fromStatus]} to ${INTERNSHIP_STATUS_LABEL[h.toStatus]}.`
      : "Placement created.",
    note: h.note,
  }));

  const handleStatusDone = (result: StatusChangeResult, done: InternshipAction) => {
    if (result.warning === "INCOMPLETE_TASKS") {
      setNotice(
        `The placement was completed, but ${result.incompleteTaskCount ?? "some"} task(s) are not approved yet.`
      );
    } else {
      setNotice(`Done: ${done.label.toLowerCase()}.`);
    }
  };

  const handleUpload = async (file: File) => {
    setUploadError(null);
    try {
      await upload.mutateAsync({ type: "INTERNSHIP_DOC", file, internId: id });
      setNotice("Document uploaded.");
    } catch (e) {
      setUploadError(e instanceof ApiError ? e.message : "Could not upload the file.");
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/staff/interns"
        className="inline-flex items-center gap-1 text-xs font-semibold text-ink transition hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all interns
      </Link>

      {/* Header */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#dfe8e1] font-heading text-lg font-bold text-ink">
            {getInitials(profile.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-mono text-[11px] text-muted">
              <span className="h-px w-5 bg-accent" />
              Intern profile / #{profile.id.slice(0, 8)}
            </p>
            <h1 className="font-heading text-2xl font-extrabold leading-tight tracking-tight text-ink">
              {profile.fullName}
              <span className="text-accent">.</span>
            </h1>
            <p className="text-sm text-muted">
              {internship ? `${internship.program.name} intern` : "No placement yet"}
            </p>
          </div>
          {internship && (
            <Badge tone={INTERNSHIP_STATUS_TONE[internship.status]} dot>
              {INTERNSHIP_STATUS_LABEL[internship.status]}
            </Badge>
          )}
        </div>
      </Card>

      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Contact and placement" divider />
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Email address">
                <a
                  href={`mailto:${profile.email}`}
                  className="underline decoration-steel/40 underline-offset-4"
                >
                  {profile.email}
                </a>
              </InfoItem>
              <InfoItem label="Phone">{profile.phone || "Not added"}</InfoItem>
              <InfoItem label="Program">{internship?.program.name ?? "None"}</InfoItem>
              <InfoItem label="Placement dates">
                {program.data
                  ? `${formatDate(program.data.internshipStartDate)} – ${formatDate(program.data.internshipEndDate)}`
                  : "..."}
              </InfoItem>
              <InfoItem label="Mentor">{internship?.mentor?.fullName ?? "Not assigned"}</InfoItem>
              {profile.contactInfo && <InfoItem label="Contact info">{profile.contactInfo}</InfoItem>}
            </dl>

            {internship && canAssign && isOpen && (
              <div className="mt-4 border-t border-line pt-3">
                <Button compact variant="outline" onClick={() => setMentorOpen(true)}>
                  {internship.mentor ? "Manage mentor assignment" : "Assign mentor"}
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Documents" divider />

            {uploadError && (
              <div className="mb-3">
                <Alert>{uploadError}</Alert>
              </div>
            )}

            <div className="space-y-2">
              {profile.cvDocumentId ? (
                <DocumentRow documentId={profile.cvDocumentId} title="Curriculum vitae" />
              ) : (
                <p className="text-sm text-muted">This intern has not uploaded a CV.</p>
              )}

              {docs.data?.data.map((doc) => (
                <DocumentRow key={doc.id} documentId={doc.id} title={doc.originalName} />
              ))}
            </div>

            {canChangeStatus && (
              <div className="mt-3 border-t border-line pt-3">
                <FileButton loading={upload.isPending} onFile={handleUpload} onError={setUploadError}>
                  Upload placement document
                </FileButton>
                <p className="mt-1 text-xs text-muted">PDF, DOC or DOCX · Maximum 10 MB</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {internship && (
            <Card className="border-transparent bg-[#e9efec]">
              <p className="font-mono text-[11px] text-muted">Placement progress</p>
              <p className="mt-2 font-heading text-4xl font-extrabold leading-none text-ink">
                {internship.progress}%
              </p>
              <ProgressBar value={internship.progress} className="mt-3" />
              <p className="mt-3 text-xs text-muted">
                {internship.taskCounts.approved} of {internship.taskCounts.total} tasks approved.
              </p>
            </Card>
          )}

          {internship && step && (
            <Card>
              <CardHeader title="Journey" />
              <Stepper steps={INTERNSHIP_STEPS} current={step.current} currentTone={step.tone} />
            </Card>
          )}

          {internship && (
            <Card>
              <CardHeader
                title="Placement status"
                meta={
                  <Badge tone={INTERNSHIP_STATUS_TONE[internship.status]} dot>
                    {INTERNSHIP_STATUS_LABEL[internship.status]}
                  </Badge>
                }
              />
              <p className="text-sm text-muted">{INTERNSHIP_STATUS_HINT[internship.status]}</p>

              {internship.status === "DROPPED" && internship.dropReason && (
                <p className="mt-2 text-xs italic text-muted">&ldquo;{internship.dropReason}&rdquo;</p>
              )}

              {canChangeStatus && actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <Button key={a.toStatus} compact variant={a.variant} onClick={() => setAction(a)}>
                      {a.label}
                    </Button>
                  ))}
                </div>
              )}

              {timelineItems.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <h3 className="mb-3 font-heading text-base font-bold text-ink">Status history</h3>
                  <Timeline items={timelineItems} />
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {internship && action && (
        <InternshipStatusDialog
          key={action.toStatus}
          internshipId={internship.id}
          action={action}
          onClose={() => setAction(null)}
          onDone={handleStatusDone}
        />
      )}

      {internship && mentorOpen && (
        <AssignMentorDialog
          internshipId={internship.id}
          currentMentorId={internship.mentor?.id}
          onClose={() => setMentorOpen(false)}
          onDone={({ mentorName, atCapacity }) =>
            setNotice(
              atCapacity
                ? `${mentorName} was assigned, but is now at or over capacity.`
                : `${mentorName} was assigned as mentor.`
            )
          }
        />
      )}
    </div>
  );
}