"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { formatDate, weeksBetween } from "@/lib/format";
import { APPLICATION_STATUS_LABEL, OPPORTUNITY_STEPS, opportunityStep } from "@/config/application-flow";
import { useProgram } from "@/hooks/use-programs";
import { useApply, useMyApplications, useMyCv } from "@/hooks/use-opportunities";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Button, buttonStyles } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { BulletList } from "@/components/ui/bullet-list";
import { StateMessage } from "@/components/ui/state-message";
import {
  getOpportunityState,
  isApplicationWindowOpen,
  OpportunityBadge,
} from "@/components/programs/opportunity-status";

function GlanceRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: program, isLoading, error } = useProgram(id);
  const applications = useMyApplications();
  const { hasCv, cv } = useMyCv();
  const apply = useApply();

  const [applyError, setApplyError] = useState<{ code: string; message: string } | null>(null);

  if (isLoading || applications.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <Card padding="none">
        <StateMessage
          icon={SearchX}
          title="Opportunity not found"
          description={error instanceof ApiError ? error.message : undefined}
          action={
            <Link href="/intern/programs" className={buttonStyles("outline", true)}>
              Back to opportunities
            </Link>
          }
        />
      </Card>
    );
  }

  const application = applications.data?.data.find((a) => a.programId === program.id);
  const state = getOpportunityState(program, !!application);
  const canApply = !application && isApplicationWindowOpen(program);
  const weeks = weeksBetween(program.internshipStartDate, program.internshipEndDate);
  const step = opportunityStep(application?.status);

  // Each line of the requirements text becomes one bullet
  const requirements = program.requirements
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const handleApply = async () => {
    setApplyError(null);
    try {
      await apply.mutateAsync(program.id);
    } catch (e) {
      setApplyError(
        e instanceof ApiError
          ? { code: e.code, message: e.message }
          : { code: "UNKNOWN_ERROR", message: "Something went wrong. Please try again." }
      );
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/intern/programs"
        className="inline-flex items-center gap-1 text-xs font-semibold text-ink transition hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to opportunities
      </Link>

      <PageHeader
        eyebrow={`Opportunities / #${program.id.slice(0, 8)}`}
        title={program.name}
        subtitle={`${weeks} weeks · Starts ${formatDate(program.internshipStartDate)}`}
        aside={<OpportunityBadge state={state} />}
      />

      <Card>
        <CardHeader eyebrow="The opportunity" title="About this placement" />
        <Stepper steps={OPPORTUNITY_STEPS} current={step.current} currentTone={step.tone} />
        <p className="mt-4 whitespace-pre-line border-t border-line pt-3 text-sm leading-relaxed text-muted">
          {program.description}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardHeader title="What we're looking for" />
          <BulletList items={requirements} />
        </Card>

        <Card>
          <CardHeader title="At a glance" />
          <dl>
            <GlanceRow label="Duration" value={`${weeks} weeks`} />
            <GlanceRow label="Starts" value={formatDate(program.internshipStartDate)} />
            <GlanceRow label="Ends" value={formatDate(program.internshipEndDate)} />
            <GlanceRow label="Deadline" value={formatDate(program.applicationCloseDate)} />
            <GlanceRow label="Places remaining" value={program.seatsLeft} />
          </dl>

          <div className="mt-4 space-y-3 border-t border-line pt-4">
            {application ? (
              <>
                <p className="text-sm text-muted">
                  You applied on {formatDate(application.appliedAt)}. Current status:{" "}
                  <span className="font-semibold text-ink">
                    {APPLICATION_STATUS_LABEL[application.status]}
                  </span>
                  .
                </p>
                <Link
                  href={`/intern/applications/${application.id}`}
                  className={`${buttonStyles("outline", true)} w-full`}
                >
                  View application
                </Link>
              </>
            ) : canApply ? (
              <>
                <p className="text-sm text-muted">
                  {hasCv ? (
                    <>
                      Your CV{" "}
                      <span className="font-semibold text-ink">{cv?.originalName ?? "..."}</span>{" "}
                      will be included with your application.
                    </>
                  ) : (
                    <>
                      You haven&apos;t uploaded a CV yet.{" "}
                      <Link
                        href="/intern/documents"
                        className="font-semibold text-ink underline underline-offset-4"
                      >
                        Upload your CV
                      </Link>
                    </>
                  )}
                </p>

                {applyError && (
                  <Alert>
                    {applyError.message}
                    {applyError.code === "CV_REQUIRED" && (
                      <>
                        {" "}
                        <Link
                          href="/intern/documents"
                          className="font-semibold underline underline-offset-4"
                        >
                          Upload your CV
                        </Link>
                      </>
                    )}
                  </Alert>
                )}

                <Button
                  compact
                  variant="accent"
                  className="w-full"
                  loading={apply.isPending}
                  onClick={handleApply}
                >
                  Confirm application
                </Button>

                <p className="text-xs text-muted">
                  Submitting shares your profile and CV with the program team.
                  {program.seatsLeft === 0 && " All places are filled, but you can still apply."}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Applications are closed for this program.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}