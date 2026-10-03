import Link from "next/link";
import { formatDateTime } from "@/lib/format-datetime";
import {
  INTERVIEW_RESULT_LABEL,
  INTERVIEW_STATUS_LABEL,
  INTERVIEW_STATUS_TONE,
  isActiveInterview,
} from "@/config/interview-flow";
import type { InterviewListItem } from "@/types/interviews";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type InterviewAction = "RESCHEDULE" | "COMPLETE" | "CANCEL";

type Props = {
  interview: InterviewListItem;
  canManage: boolean;
  onAction: (action: InterviewAction) => void;
};

const linkButton = "text-sm font-semibold underline underline-offset-4";

export function InterviewCard({ interview, canManage, onAction }: Props) {
  const active = isActiveInterview(interview.status);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] text-muted">{formatDateTime(interview.scheduledAt)}</p>
        <Badge tone={INTERVIEW_STATUS_TONE[interview.status]} dot>
          {INTERVIEW_STATUS_LABEL[interview.status]}
        </Badge>
      </div>

      <Link
        href={`/staff/applications/${interview.application.id}`}
        className="mt-2 block font-heading text-lg font-bold leading-tight text-ink hover:underline"
      >
        {interview.applicant.fullName}
      </Link>
      <p className="mt-0.5 text-sm text-muted">
        With {interview.interviewer.fullName} · {interview.program.name}
      </p>

      {interview.result && (
        <p className="mt-2 text-xs text-muted">
          Result:{" "}
          <span className="font-semibold text-ink">{INTERVIEW_RESULT_LABEL[interview.result]}</span>
        </p>
      )}

      {active && canManage && (
        <div className="mt-3 flex gap-4 border-t border-line pt-3">
          <button type="button" onClick={() => onAction("RESCHEDULE")} className={`${linkButton} text-ink`}>
            Reschedule
          </button>
          <button type="button" onClick={() => onAction("COMPLETE")} className={`${linkButton} text-steel`}>
            Complete
          </button>
          <button type="button" onClick={() => onAction("CANCEL")} className={`${linkButton} text-danger`}>
            Cancel
          </button>
        </div>
      )}
    </Card>
  );
}