"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { toDateTimeLocal } from "@/lib/format-datetime";
import { INTERVIEW_RESULT_LABEL } from "@/config/interview-flow";
import { useStaffOptions } from "@/hooks/use-applications";
import { useInterviewAction } from "@/hooks/use-interviews";
import type { InterviewResult } from "@/types/applications";
import type { InterviewListItem } from "@/types/interviews";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { InterviewAction } from "./interview-card";

type Props = {
  interview: InterviewListItem;
  action: InterviewAction;
  onClose: () => void;
};

const TITLES: Record<InterviewAction, string> = {
  RESCHEDULE: "Reschedule interview",
  COMPLETE: "Complete interview",
  CANCEL: "Cancel interview",
};

// Render this conditionally (with a key) so the fields start fresh for each interview
export function InterviewActionDialog({ interview, action, onClose }: Props) {
  const mutation = useInterviewAction(interview.id);
  const staff = useStaffOptions(action === "RESCHEDULE");

  const [interviewerId, setInterviewerId] = useState(interview.interviewer.id);
  const [when, setWhen] = useState(toDateTimeLocal(interview.scheduledAt));
  const [result, setResult] = useState<InterviewResult | "">("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (action === "RESCHEDULE") {
        const date = new Date(when);
        if (!when || Number.isNaN(date.getTime())) {
          setError("Choose a date and time.");
          return;
        }
        if (date.getTime() <= Date.now()) {
          setError("The interview must be in the future.");
          return;
        }
        await mutation.mutateAsync({
          action: "RESCHEDULE",
          scheduledAt: date.toISOString(),
          // Only send the interviewer when it changed
          ...(interviewerId !== interview.interviewer.id ? { interviewerId } : {}),
        });
      }

      if (action === "COMPLETE") {
        if (!result) {
          setError("Choose the interview result.");
          return;
        }
        await mutation.mutateAsync({
          action: "COMPLETE",
          result,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        });
      }

      if (action === "CANCEL") {
        if (!reason.trim()) {
          setError("Add a reason for the cancellation.");
          return;
        }
        await mutation.mutateAsync({ action: "CANCEL", reason: reason.trim() });
      }

      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Modal open title={TITLES[action]} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-muted">
          {action === "RESCHEDULE" && "Set a time that works for the applicant and the team."}
          {action === "COMPLETE" &&
            `Record the outcome of ${interview.applicant.fullName}'s interview.`}
          {action === "CANCEL" &&
            `Cancel the interview with ${interview.applicant.fullName}? It stays in the schedule as a cancelled record.`}
        </p>

        {error && <Alert>{error}</Alert>}

        {action === "RESCHEDULE" && (
          <>
            <div>
              <label htmlFor="interviewer" className="mb-1.5 block text-sm font-medium text-ink">
                Interviewer
              </label>
              <Select
                id="interviewer"
                className="w-full"
                value={interviewerId}
                onChange={(e) => setInterviewerId(e.target.value)}
              >
                {/* Keep the current interviewer selectable while the list loads */}
                {!staff.data?.data.some((s) => s.id === interview.interviewer.id) && (
                  <option value={interview.interviewer.id}>{interview.interviewer.fullName}</option>
                )}
                {staff.data?.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              size="sm"
              type="datetime-local"
              label="Date and time"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </>
        )}

        {action === "COMPLETE" && (
          <>
            <div>
              <label htmlFor="result" className="mb-1.5 block text-sm font-medium text-ink">
                Result
              </label>
              <Select
                id="result"
                className="w-full"
                value={result}
                onChange={(e) => setResult(e.target.value as InterviewResult | "")}
              >
                <option value="">Choose a result</option>
                {(Object.keys(INTERVIEW_RESULT_LABEL) as InterviewResult[]).map((r) => (
                  <option key={r} value={r}>
                    {INTERVIEW_RESULT_LABEL[r]}
                  </option>
                ))}
              </Select>
            </div>
            <Textarea
              label="Result notes"
              rows={3}
              maxLength={2000}
              placeholder="Summarize the interview outcome"
              helper="Internal notes. Interns cannot see them."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {action === "CANCEL" && (
          <Textarea
            label="Reason"
            rows={3}
            maxLength={500}
            placeholder="Why is this interview being cancelled?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button compact variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Back
          </Button>
          <Button
            type="submit"
            compact
            variant={action === "CANCEL" ? "danger" : "accent"}
            loading={mutation.isPending}
          >
            {action === "RESCHEDULE" && "Save new time"}
            {action === "COMPLETE" && "Save result"}
            {action === "CANCEL" && "Confirm cancellation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}