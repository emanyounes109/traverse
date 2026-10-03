"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, SearchX, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import {
  LIFECYCLE_STEPS,
  PRIMARY_ACTION,
  PROGRAM_STATUS_META,
  SECONDARY_ACTION,
  STATUS_STEP,
} from "@/config/program-lifecycle";
import type { LifecycleAction } from "@/config/program-lifecycle";
import { useApplicationsCount, useProgram, useProgramAction } from "@/hooks/use-programs";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StateMessage } from "@/components/ui/state-message";
import { ProgramForm } from "@/components/programs/program-form";
import { ProgramStatusBadge } from "@/components/programs/program-status-badge";

function GlanceRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("CAN_MANAGE_PROGRAMS");

  const { data: program, isLoading, error } = useProgram(id);
  const applications = useApplicationsCount(id, hasPermission("CAN_REVIEW_APPLICATIONS"));
  const lifecycle = useProgramAction(id);

  // The action waiting for the user's confirmation
  const [pending, setPending] = useState<LifecycleAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!canManage) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to manage programs."
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

  if (error || !program) {
    return (
      <Card padding="none">
        <StateMessage
          icon={SearchX}
          title="Program not found"
          description={error instanceof ApiError ? error.message : undefined}
        />
      </Card>
    );
  }

  const meta = PROGRAM_STATUS_META[program.status];
  const primary = PRIMARY_ACTION[program.status];
  const secondary = SECONDARY_ACTION[program.status];
  const filled = program.capacity > 0 ? (program.acceptedCount / program.capacity) * 100 : 0;

  const openConfirm = (action: LifecycleAction) => {
    setActionError(null);
    setPending(action);
  };

  const handleConfirm = async () => {
    if (!pending) return;
    setActionError(null);
    try {
      await lifecycle.mutateAsync(pending.action);
      setPending(null);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/staff/programs"
        className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All programs
      </Link>

      <PageHeader
        eyebrow={`Programs / ${program.name}`}
        title={program.name}
        subtitle="Manage the details and timeline for this placement."
        aside={<ProgramStatusBadge status={program.status} />}
      />

      {/* Lifecycle */}
      <Card>
        <CardHeader
          eyebrow="Program lifecycle"
          title="From first application to final reflection"
          meta={`#${program.id.slice(0, 8)}`}
        />
        <Stepper steps={LIFECYCLE_STEPS} current={STATUS_STEP[program.status]} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="max-w-xl text-sm text-muted">{meta.hint}</p>
          <div className="flex items-center gap-2">
            {secondary && (
              <Button compact variant="outline" onClick={() => openConfirm(secondary)}>
                {secondary.label}
              </Button>
            )}
            {primary && (
              <Button compact variant="accent" onClick={() => openConfirm(primary)}>
                {primary.label}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Details + at a glance */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <CardHeader title="Program details" divider />
          <ProgramForm mode="edit" program={program} />
        </Card>

        <div className="space-y-4">
          <Card className="border-transparent bg-[#e9efec]">
            <p className="font-mono text-[11px] text-muted">At a glance</p>
            <p className="mt-2 font-heading text-4xl font-extrabold leading-none text-ink">
              {program.acceptedCount}
              <span className="text-xl font-semibold text-steel">/{program.capacity}</span>
            </p>
            <p className="mt-1 text-xs text-muted">places filled</p>
            <ProgressBar value={filled} className="mt-3" />

            <dl className="mt-4 space-y-2 border-t border-ink/10 pt-3 text-xs">
              <GlanceRow label="Seats left" value={program.seatsLeft} />
              {applications.data !== undefined && (
                <GlanceRow label="Applications" value={`${applications.data} received`} />
              )}
              <GlanceRow label="Created" value={formatDate(program.createdAt)} />
              <GlanceRow label="Last updated" value={formatDate(program.updatedAt)} />
            </dl>
          </Card>

          <p className="px-1 font-heading text-base font-semibold leading-snug text-muted">
            Keep details current so interns and mentors know what to expect at each stage.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={!!pending}
        title={pending?.confirmTitle ?? ""}
        description={pending?.confirmText ?? ""}
        confirmLabel={pending?.label ?? "Confirm"}
        tone={pending?.tone}
        loading={lifecycle.isPending}
        error={actionError}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}