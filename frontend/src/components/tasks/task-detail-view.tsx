import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/format";
import { formatDateTime } from "@/lib/format-datetime";
import { formatBytes } from "@/lib/format-bytes";
import { TASK_STATUS_LABEL, describeTaskHistory, taskStepper } from "@/config/task-flow";
import type { TaskDetail, TaskHistoryEntry, TaskSubmission } from "@/types/tasks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Timeline } from "@/components/ui/timeline";
import { InfoItem } from "@/components/ui/info-item";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { DocumentItem } from "@/components/documents/document-item";
import { PriorityBadge } from "./task-badges";
import { TASK_PRIORITY_LABEL } from "@/config/task-flow";

type Props = {
  task: TaskDetail;
  submissions: TaskSubmission[];
  history: TaskHistoryEntry[];
  backHref: string;
  // Role specific actions card (intern: start / submit, staff: review)
  children: ReactNode;
};

export function TaskDetailView({ task, submissions, history, backHref, children }: Props) {
  const stepper = taskStepper(task.status);

  // Newest first
  const timelineItems = [...history].reverse().map((h) => ({
    id: h.id,
    date: formatDate(h.createdAt),
    title: describeTaskHistory(h),
    note: h.note,
  }));

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs font-semibold text-ink transition hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to task board
      </Link>

      <PageHeader
        eyebrow={`Tasks / #${task.id.slice(0, 8)}`}
        title={task.title}
        subtitle={`Assigned to ${task.intern.fullName}. Due ${formatDate(task.deadline)}.`}
        aside={<PriorityBadge priority={task.priority} />}
      />

      <Card>
        <CardHeader
          eyebrow="Task lifecycle"
          title={TASK_STATUS_LABEL[task.status]}
          meta={`#${task.id.slice(0, 8)}`}
        />
        <Stepper steps={stepper.steps} current={stepper.current} currentTone={stepper.tone} />
        {task.isOverdue && (
          <div className="mt-3">
            <Alert>This task is overdue. The deadline was {formatDate(task.deadline)}.</Alert>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="About this task" divider />
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{task.description}</p>
            <dl className="mt-4 grid gap-4 border-t border-line pt-3 sm:grid-cols-3">
              <InfoItem label="Deadline">{formatDate(task.deadline)}</InfoItem>
              <InfoItem label="Priority">{TASK_PRIORITY_LABEL[task.priority]}</InfoItem>
              <InfoItem label="Assigned to">{task.intern.fullName}</InfoItem>
            </dl>
          </Card>

          {children}

          <Card>
            <CardHeader
              title="Review and feedback"
              divider
              meta={`${submissions.length} version${submissions.length === 1 ? "" : "s"}`}
            />

            {submissions.length === 0 ? (
              <p className="text-sm text-muted">Nothing has been submitted yet.</p>
            ) : (
              <ul className="space-y-4">
                {submissions.map((s) => (
                  <li key={s.id}>
                    <DocumentItem
                      documentId={s.documentId}
                      title={`Version ${s.version}`}
                      subtitle={`${s.document?.originalName ?? "Submitted file"}${
                        s.document ? ` · ${formatBytes(s.document.sizeBytes)}` : ""
                      } · ${formatDateTime(s.submittedAt)}`}
                    />
                    {(s.isLate || s.note) && (
                      <div className="mt-1.5 pl-[52px]">
                        {s.isLate && <Badge tone="danger">Submitted late</Badge>}
                        {s.note && <p className="mt-1 text-xs italic text-muted">&ldquo;{s.note}&rdquo;</p>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {task.feedback.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <h3 className="mb-3 font-heading text-base font-bold text-ink">Feedback</h3>
                <ul className="space-y-3">
                  {[...task.feedback].reverse().map((f) => (
                    <li key={f.id} className="rounded-md bg-canvas px-3 py-2.5">
                      <p className="text-sm text-ink">{f.comment}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted">
                        {f.staff.fullName} · {formatDateTime(f.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="Task history" />
          <Timeline items={timelineItems} />
        </Card>
      </div>
    </div>
  );
}