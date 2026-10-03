"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useAssignMentor, useMentorWorkload } from "@/hooks/use-interns";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Props = {
  internshipId: string;
  currentMentorId?: string;
  onClose: () => void;
  onDone: (result: { mentorName: string; atCapacity: boolean }) => void;
};

export function AssignMentorDialog({ internshipId, currentMentorId, onClose, onDone }: Props) {
  const workload = useMentorWorkload(true);
  const assign = useAssignMentor(internshipId);

  const [staffId, setStaffId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!staffId) {
      setError("Choose a mentor.");
      return;
    }

    try {
      const res = await assign.mutateAsync(staffId);
      const mentor = workload.data?.find((m) => m.id === staffId);
      onDone({ mentorName: mentor?.fullName ?? "The mentor", atCapacity: res.warning === "MENTOR_AT_CAPACITY" });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Modal open title={currentMentorId ? "Change mentor" : "Assign mentor"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-muted">
          Choose who will guide this intern. Assigning a new mentor replaces the current one.
        </p>

        {error && <Alert>{error}</Alert>}
        {workload.error && (
          <Alert>
            {workload.error instanceof ApiError
              ? workload.error.message
              : "Could not load mentors."}
          </Alert>
        )}

        <div>
          <label htmlFor="mentor" className="mb-1.5 block text-sm font-medium text-ink">
            Mentor
          </label>
          <Select
            id="mentor"
            className="w-full"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            <option value="">{workload.isLoading ? "Loading..." : "Choose a mentor"}</option>
            {workload.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.activeInternCount}/{m.maxInterns}
                {m.atCapacity ? ", at capacity" : ""})
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-muted">
            The numbers show how many active interns each mentor has. You can still assign a mentor
            who is at capacity.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button compact variant="outline" onClick={onClose} disabled={assign.isPending}>
            Cancel
          </Button>
          <Button type="submit" compact variant="accent" loading={assign.isPending}>
            Assign mentor
          </Button>
        </div>
      </form>
    </Modal>
  );
}