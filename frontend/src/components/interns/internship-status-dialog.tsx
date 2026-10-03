"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import type { InternshipAction } from "@/config/internship-flow";
import { useChangeInternshipStatus } from "@/hooks/use-interns";
import type { StatusChangeResult } from "@/hooks/use-interns";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Props = {
  internshipId: string;
  action: InternshipAction;
  onClose: () => void;
  onDone: (result: StatusChangeResult, action: InternshipAction) => void;
};

// Render this conditionally (with a key) so the reason field starts empty
export function InternshipStatusDialog({ internshipId, action, onClose, onDone }: Props) {
  const change = useChangeInternshipStatus(internshipId);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);

    if (action.requiresReason && !reason.trim()) {
      setError("Add a reason before continuing.");
      return;
    }

    try {
      const result = await change.mutateAsync({
        toStatus: action.toStatus,
        ...(action.requiresReason ? { reason: reason.trim() } : {}),
      });
      onDone(result, action);
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

      {action.requiresReason && (
        <div className="mt-3">
          <Textarea
            label="Reason"
            rows={3}
            maxLength={500}
            placeholder="Why is this placement being dropped?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
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