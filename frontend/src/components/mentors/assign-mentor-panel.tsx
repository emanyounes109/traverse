"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { initialsOf } from "@/lib/dashboard-utils";
import { DASH_INTERNSHIP_STATUS_LABEL } from "@/config/dashboard";
import { useAssignMentor } from "@/hooks/use-mentors";
import type { MentorWorkloadItem, MentorableIntern } from "@/types/mentors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { StateMessage } from "@/components/ui/state-message";

type Props = {
  interns: MentorableIntern[];
  mentors: MentorWorkloadItem[];
  selected: MentorableIntern | undefined;
  canAssign: boolean;
  onSelect: (internshipId: string) => void;
};

export function AssignMentorPanel({ interns, mentors, selected, canAssign, onSelect }: Props) {
  const mutation = useAssignMentor();
  const [mentorId, setMentorId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [atCapacity, setAtCapacity] = useState(false);

  if (interns.length === 0 || !selected) {
    return (
      <Card padding="none">
        <StateMessage
          icon={UserPlus}
          title="No open internships"
          description="Interns you can assign a mentor to will appear here."
        />
      </Card>
    );
  }

  const currentMentorId = selected.mentor?.id;
  const options = mentors.filter((m) => m.id !== currentMentorId);
  const hasMentor = !!selected.mentor;

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setAtCapacity(false);
  };

  const handleAssign = async () => {
    if (!mentorId) return;
    clearMessages();
    try {
      const result = await mutation.mutateAsync({
        internshipId: selected.internshipId,
        staffId: mentorId,
      });
      setSuccess(hasMentor ? "The mentor was changed." : "The mentor was assigned.");
      setAtCapacity(result.warning === "MENTOR_AT_CAPACITY");
      setMentorId("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Card>
      <div>
        <label htmlFor="mentor-intern" className="mb-1.5 block text-sm font-medium text-ink">
          Intern
        </label>
        <Select
          id="mentor-intern"
          className="w-full"
          value={selected.internshipId}
          onChange={(e) => {
            onSelect(e.target.value);
            setMentorId("");
            clearMessages();
          }}
        >
          {interns.map((intern) => (
            <option key={intern.internshipId} value={intern.internshipId}>
              {intern.fullName ?? intern.email} · {intern.program.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 flex items-center gap-3 border-b border-line pb-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft font-heading text-sm font-bold text-ink">
          {initialsOf(selected.fullName)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{selected.fullName ?? selected.email}</p>
          <p className="truncate text-xs text-muted">
            {selected.program.name} · {DASH_INTERNSHIP_STATUS_LABEL[selected.status]}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">Current mentor</span>
        <span className="font-semibold text-ink">{selected.mentor?.fullName ?? "Not assigned"}</span>
      </div>

      {canAssign ? (
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="mentor-pick" className="mb-1.5 block text-sm font-medium text-ink">
              {hasMentor ? "Reassign to" : "Assign to"}
            </label>
            <Select
              id="mentor-pick"
              className="w-full"
              value={mentorId}
              onChange={(e) => {
                setMentorId(e.target.value);
                clearMessages();
              }}
            >
              <option value="">Choose a mentor</option>
              {options.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.activeInternCount}/{m.maxInterns})
                </option>
              ))}
            </Select>
          </div>

          {error && <Alert>{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {atCapacity && (
            <p className="rounded-md bg-accent-soft px-3 py-2 text-sm text-ink">
              This mentor is now above the usual number of interns. The assignment was saved.
            </p>
          )}

          <Button
            variant="accent"
            className="w-full"
            disabled={!mentorId}
            loading={mutation.isPending}
            onClick={handleAssign}
          >
            {hasMentor ? "Reassign mentor" : "Assign mentor"}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted">You need the assign-mentor permission to change mentors.</p>
      )}
    </Card>
  );
}