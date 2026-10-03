"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { useReviewTask, useStartReview } from "@/hooks/use-tasks";
import type { TaskDetail } from "@/types/tasks";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditTaskDialog } from "./edit-task-dialog";

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : "Something went wrong. Please try again.";
}

export function StaffTaskActions({ task }: { task: TaskDetail }) {
  const { hasPermission } = useAuth();
  const canReview = hasPermission("CAN_REVIEW_TASKS");
  // Approved tasks are locked by the API
  const canEdit = hasPermission("CAN_MANAGE_TASKS") && task.status !== "APPROVED";
  const canAudit = hasPermission("CAN_VIEW_AUDIT");

  const startReview = useStartReview(task.id);
  const review = useReviewTask(task.id);

  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleStartReview = async () => {
    setError(null);
    setNotice(null);
    try {
      await startReview.mutateAsync();
    } catch (e) {
      setError(messageOf(e));
    }
  };

  const decide = async (decision: "APPROVE" | "REQUEST_CHANGES") => {
    setError(null);
    setNotice(null);

    if (decision === "REQUEST_CHANGES" && !feedback.trim()) {
      setError("Add feedback so the intern knows what to change.");
      return;
    }

    try {
      await review.mutateAsync({
        decision,
        ...(feedback.trim() ? { feedback: feedback.trim() } : {}),
      });
      setFeedback("");
      setApproveOpen(false);
    } catch (e) {
      setError(messageOf(e));
    }
  };

  let content: React.ReactNode;

  if (task.status === "SUBMITTED") {
    content = canReview ? (
      <>
        <p className="text-sm text-muted">The intern submitted their work. Start the review to look at it.</p>
        <div className="mt-3">
          <Button compact variant="accent" loading={startReview.isPending} onClick={handleStartReview}>
            Start review
          </Button>
        </div>
      </>
    ) : (
      <p className="text-sm text-muted">You need review permissions to act on submissions.</p>
    );
  } else if (task.status === "UNDER_REVIEW") {
    content = canReview ? (
      <>
        <p className="text-sm text-muted">
          Approve the work, or ask for changes with feedback. Approving locks the task.
        </p>
        <div className="mt-3 space-y-3">
          <Textarea
            label="Feedback"
            rows={3}
            maxLength={2000}
            placeholder="Share what went well and what to improve"
            helper="Required when requesting changes. The intern can read it."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button compact variant="accent" onClick={() => setApproveOpen(true)}>
              Approve
            </Button>
            <Button
              compact
              variant="outline"
              loading={review.isPending && !approveOpen}
              onClick={() => decide("REQUEST_CHANGES")}
            >
              Request changes
            </Button>
          </div>
        </div>
      </>
    ) : (
      <p className="text-sm text-muted">You need review permissions to act on submissions.</p>
    );
  } else if (task.status === "APPROVED") {
    content = <p className="text-sm text-muted">This task is approved and locked.</p>;
  } else {
    content = <p className="text-sm text-muted">No action is needed right now. Waiting for the intern.</p>;
  }

  return (
    <Card>
      <CardHeader
        title="Next step"
        divider
        meta={
          canEdit ? (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="font-sans text-sm font-semibold text-ink underline underline-offset-4"
            >
              Edit task
            </button>
          ) : undefined
        }
      />

      {notice && (
        <div className="mb-3">
          <Alert variant="success">{notice}</Alert>
        </div>
      )}
      {error && !approveOpen && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {content}

      {canAudit && (
        <div className="mt-4 border-t border-line pt-3">
          <Link
            href={`/staff/audit?type=task&id=${task.id}`}
            className="text-xs font-semibold text-ink underline underline-offset-4"
          >
            View audit history
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={approveOpen}
        title="Approve this task?"
        description="The task will be locked and will count toward the intern's progress."
        confirmLabel="Approve"
        loading={review.isPending}
        error={error}
        onConfirm={() => decide("APPROVE")}
        onCancel={() => setApproveOpen(false)}
      />

      {editOpen && (
        <EditTaskDialog
          task={task}
          onClose={() => setEditOpen(false)}
          onSaved={() => setNotice("Task updated.")}
        />
      )}
    </Card>
  );
}