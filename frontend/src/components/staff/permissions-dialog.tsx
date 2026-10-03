"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import type { Permission } from "@/types/api";
import {
  useApproveStaff,
  useRejectStaff,
  useUpdateStaffPermissions,
} from "@/hooks/use-staff";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PermissionPicker } from "./permission-picker";

type Props = {
  // "approve" for a pending request, "edit" for an active staff member
  mode: "approve" | "edit";
  person: { id: string; fullName: string; email: string };
  initialPermissions: Permission[];
  onClose: () => void;
};

// Render this conditionally (with a key) so the state starts fresh for each person
export function PermissionsDialog({ mode, person, initialPermissions, onClose }: Props) {
  const approve = useApproveStaff();
  const reject = useRejectStaff();
  const update = useUpdateStaffPermissions();

  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [confirmReject, setConfirmReject] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = approve.isPending || reject.isPending || update.isPending;

  const run = async (task: () => Promise<unknown>) => {
    setError(null);
    try {
      await task();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setConfirmReject(false);
    }
  };

  const title = mode === "approve" ? "Review staff request" : "Edit permissions";

  return (
    <Modal open title={title} size="lg" onClose={onClose}>
      <div className="mb-3 rounded-md bg-canvas px-3 py-2">
        <p className="text-sm font-semibold text-ink">{person.fullName}</p>
        <p className="text-xs text-muted">{person.email}</p>
      </div>

      <p className="mb-2 text-sm text-muted">
        {mode === "approve"
          ? "Choose what this person can do. You can change this later."
          : "Saving replaces the full set of permissions."}
      </p>

      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="max-h-[45vh] overflow-y-auto rounded-md border border-line p-1">
        <PermissionPicker value={permissions} onChange={setPermissions} disabled={busy} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div>
          {mode === "approve" && (
            <Button
              compact
              variant="dangerOutline"
              disabled={busy}
              loading={reject.isPending}
              onClick={() => {
                if (!confirmReject) {
                  setConfirmReject(true);
                  return;
                }
                run(() => reject.mutateAsync(person.id));
              }}
            >
              {confirmReject ? "Confirm reject" : "Reject"}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button compact variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {mode === "approve" ? (
            <Button
              compact
              variant="accent"
              loading={approve.isPending}
              disabled={busy}
              onClick={() => run(() => approve.mutateAsync({ id: person.id, permissions }))}
            >
              Approve
            </Button>
          ) : (
            <Button
              compact
              variant="accent"
              loading={update.isPending}
              disabled={busy}
              onClick={() => run(() => update.mutateAsync({ id: person.id, permissions }))}
            >
              Save permissions
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}