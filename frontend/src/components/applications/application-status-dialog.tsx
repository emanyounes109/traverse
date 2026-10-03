"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import type { StatusAction } from "@/config/application-flow";
import { useChangeApplicationStatus } from "@/hooks/use-applications";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Props = {
  applicationId: string;
  action: StatusAction;
  onClose: () => void;
  onDone: (action: StatusAction) => void;
};

// Rendered only while open, so the note starts empty every time
export function ApplicationStatusDialog({ applicationId, action, onClose, onDone }: Props) {
  const change = useChangeApplicationStatus(applicationId);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  // A rejection must come with a reason (stored as an internal note)
  const isReject = action.toStatus === "REJECTED";

  const handleConfirm = async () => {
    setError(null);

    if (isReject && !note.trim()) {
      setError("Add the reason for rejecting this applicant.");
      return;
    }

    try {
      await change.mutateAsync({
        toStatus: action.toStatus,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      onDone(action);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Modal open title={action.confirmTitle} onClose={onClose}>
      <p className="text-sm text-muted">{action.confirmText}</p>

      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {isReject && (
        <div className="mt-3">
          <Textarea
            label="Reason for rejection"
            rows={3}
            maxLength={1000}
            placeholder="Explain why this application is being rejected"
            helper="Internal note. The applicant cannot see it."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button compact variant="outline" onClick={onClose} disabled={change.isPending}>
          Cancel
        </Button>
        <Button
          compact
          variant={action.tone === "danger" ? "danger" : "accent"}
          loading={change.isPending}
          onClick={handleConfirm}
        >
          {action.label}
        </Button>
      </div>
    </Modal>
  );
}