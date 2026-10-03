"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useScheduleInterview, useStaffOptions } from "@/hooks/use-applications";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Props = {
  applicationId: string;
  open: boolean;
  onClose: () => void;
};

export function ScheduleInterviewDialog({ applicationId, open, onClose }: Props) {
  const staff = useStaffOptions(open);
  const schedule = useScheduleInterview(applicationId);

  const [interviewerId, setInterviewerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!interviewerId) {
      setError("Choose an interviewer.");
      return;
    }
    if (!scheduledAt) {
      setError("Choose a date and time.");
      return;
    }

    const date = new Date(scheduledAt);
    if (date.getTime() <= Date.now()) {
      setError("The interview must be in the future.");
      return;
    }

    try {
      await schedule.mutateAsync({ interviewerId, scheduledAt: date.toISOString() });
      setInterviewerId("");
      setScheduledAt("");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Modal open={open} title="Schedule interview" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <Alert>{error}</Alert>}

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
            <option value="">{staff.isLoading ? "Loading..." : "Choose a staff member"}</option>
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
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button compact variant="outline" onClick={onClose} disabled={schedule.isPending}>
            Cancel
          </Button>
          <Button type="submit" compact variant="accent" loading={schedule.isPending}>
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}