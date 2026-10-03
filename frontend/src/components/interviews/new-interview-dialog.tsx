"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useStaffOptions } from "@/hooks/use-applications";
import { useCreateInterview, useSchedulableApplications } from "@/hooks/use-interviews";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function NewInterviewDialog({ onClose }: { onClose: () => void }) {
  const applications = useSchedulableApplications(true);
  const staff = useStaffOptions(true);
  const create = useCreateInterview();

  const [applicationId, setApplicationId] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [when, setWhen] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!applicationId) return setError("Choose an applicant.");
    if (!interviewerId) return setError("Choose an interviewer.");

    const date = new Date(when);
    if (!when || Number.isNaN(date.getTime())) return setError("Choose a date and time.");
    if (date.getTime() <= Date.now()) return setError("The interview must be in the future.");

    try {
      await create.mutateAsync({ applicationId, interviewerId, scheduledAt: date.toISOString() });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Modal open title="Schedule interview" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-muted">Pick a shortlisted applicant and a time that works.</p>

        {error && <Alert>{error}</Alert>}
        {applications.error && (
          <Alert>
            {applications.error instanceof ApiError
              ? applications.error.message
              : "Could not load applicants."}
          </Alert>
        )}

        <div>
          <label htmlFor="applicant" className="mb-1.5 block text-sm font-medium text-ink">
            Applicant
          </label>
          <Select
            id="applicant"
            className="w-full"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
          >
            <option value="">
              {applications.isLoading
                ? "Loading..."
                : applications.data && applications.data.length === 0
                  ? "No shortlisted applicants"
                  : "Choose an applicant"}
            </option>
            {applications.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.applicant.fullName} · {a.program.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="new-interviewer" className="mb-1.5 block text-sm font-medium text-ink">
            Interviewer
          </label>
          <Select
            id="new-interviewer"
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
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button compact variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" compact variant="accent" loading={create.isPending}>
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}