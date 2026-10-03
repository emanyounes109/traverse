"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { formatBytes } from "@/lib/format-bytes";
import { useStartTask, useSubmitTask } from "@/hooks/use-tasks";
import type { TaskDetail } from "@/types/tasks";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { FileButton } from "@/components/ui/file-button";

const ACCEPTED_FILES = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip";

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : "Something went wrong. Please try again.";
}

export function InternTaskActions({ task }: { task: TaskDetail }) {
  const start = useStartTask(task.id);
  const submit = useSubmitTask(task.id);

  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Intern actions are blocked once the internship is closed
  const closed = task.internship.status === "COMPLETED" || task.internship.status === "DROPPED";

  const handleStart = async () => {
    setError(null);
    setNotice(null);
    try {
      await start.mutateAsync();
    } catch (e) {
      setError(messageOf(e));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setNotice(null);

    if (!file) {
      setError("Choose a file to submit.");
      return;
    }

    try {
      await submit.mutateAsync({ file, note: note.trim() || undefined });
      setFile(null);
      setNote("");
      setNotice("Your work was submitted.");
    } catch (e) {
      setError(messageOf(e));
    }
  };

  let content: React.ReactNode;

  if (closed) {
    content = (
      <p className="text-sm text-muted">
        This internship is closed, so the task can no longer be changed.
      </p>
    );
  } else if (task.status === "PENDING" || task.status === "CHANGES_REQUESTED") {
    content = (
      <>
        <p className="text-sm text-muted">
          {task.status === "PENDING"
            ? "When you are ready, start the task to let your mentor know you are working on it."
            : "Your mentor asked for changes. Read the feedback below, then start the task again."}
        </p>
        <div className="mt-3">
          <Button compact variant="accent" loading={start.isPending} onClick={handleStart}>
            {task.status === "PENDING" ? "Start task" : "Start again"}
          </Button>
        </div>
      </>
    );
  } else if (task.status === "IN_PROGRESS" || task.status === "SUBMITTED") {
    content = (
      <>
        <p className="text-sm text-muted">
          {task.status === "IN_PROGRESS"
            ? "Upload your work and add a short note if it helps. Your mentor will review it next."
            : "Your work is waiting for review. You can still replace the file with a new version."}
        </p>

        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-line bg-canvas/50 px-3 py-2.5">
            <FileButton accept={ACCEPTED_FILES} onFile={setFile} onError={setError}>
              {file ? "Choose a different file" : "Choose file"}
            </FileButton>
            <span className="min-w-0 truncate text-xs text-muted">
              {file ? `${file.name} · ${formatBytes(file.size)}` : "PDF, DOC, DOCX, PNG, JPG or ZIP · Maximum 10 MB"}
            </span>
          </div>

          <Textarea
            label="Note"
            rows={3}
            maxLength={1000}
            placeholder="Describe what you completed (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Button compact variant="accent" loading={submit.isPending} onClick={handleSubmit}>
            {task.status === "IN_PROGRESS" ? "Submit task" : "Replace submission"}
          </Button>
        </div>
      </>
    );
  } else if (task.status === "UNDER_REVIEW") {
    content = <p className="text-sm text-muted">Your mentor is reviewing your work right now.</p>;
  } else {
    content = <p className="text-sm text-muted">This task is approved. Great work!</p>;
  }

  return (
    <Card>
      <CardHeader title={task.status === "IN_PROGRESS" || task.status === "SUBMITTED" ? "Submission" : "Next step"} divider />
      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}
      {notice && (
        <div className="mb-3">
          <Alert variant="success">{notice}</Alert>
        </div>
      )}
      {content}
    </Card>
  );
}