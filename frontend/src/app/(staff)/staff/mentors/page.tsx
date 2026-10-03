"use client";

import { useMemo, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { pad2 } from "@/lib/dashboard-utils";
import { useMentorWorkload, useMentorableInterns } from "@/hooks/use-mentors";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StateMessage } from "@/components/ui/state-message";
import { SectionTitle } from "@/components/dashboard/section-title";
import { MentorWorkloadList } from "@/components/mentors/mentor-workload-list";
import { AssignMentorPanel } from "@/components/mentors/assign-mentor-panel";
import { MentorHistoryPanel } from "@/components/mentors/mentor-history-panel";

const OPEN_STATUSES = ["ACCEPTED", "ONBOARDING", "ACTIVE"];

export default function MentorsPage() {
  const { hasPermission } = useAuth();
  const canAssign = hasPermission("CAN_ASSIGN_MENTOR");
  const canView = canAssign || hasPermission("CAN_VIEW_ALL_INTERNS");

  const workload = useMentorWorkload(canView);
  const internsQuery = useMentorableInterns(canView);
  const [selectedId, setSelectedId] = useState("");

  // Only open internships can get a mentor
  const openInterns = useMemo(
    () => (internsQuery.data?.data ?? []).filter((i) => OPEN_STATUSES.includes(i.status)),
    [internsQuery.data]
  );
  const selected = openInterns.find((i) => i.internshipId === selectedId) ?? openInterns[0];

  if (!canView) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to mentor assignments."
        />
      </Card>
    );
  }

  if (workload.isLoading || internsQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  const loadError = workload.error ?? internsQuery.error;
  if (loadError || !workload.data) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="Could not load mentors"
          description={loadError instanceof ApiError ? loadError.message : undefined}
        />
      </Card>
    );
  }

  const mentors = workload.data;
  const activeAssignments = mentors.reduce((sum, m) => sum + m.activeInternCount, 0);
  const unassigned = openInterns.filter((i) => !i.mentor).length;
  const maxInterns = mentors[0]?.maxInterns;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People / Mentors"
        title="Mentor assignments"
        subtitle="Balance support across the team and keep every handoff on record."
      />

      <div className="grid overflow-hidden rounded-xl bg-brand text-white sm:grid-cols-[1fr_1fr_1fr_2fr]">
        <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
          <p className="font-heading text-4xl font-bold">{pad2(activeAssignments)}</p>
          <p className="mt-1 text-xs text-white/70">active assignments</p>
        </div>
        <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
          <p className="font-heading text-4xl font-bold">{pad2(mentors.length)}</p>
          <p className="mt-1 text-xs text-white/70">mentors</p>
        </div>
        <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
          <p className="font-heading text-4xl font-bold">{pad2(unassigned)}</p>
          <p className="mt-1 text-xs text-white/70">without a mentor</p>
        </div>
        <div className="p-5">
          <p className="font-mono text-[11px] text-white/60">Workload guide</p>
          <p className="mt-1 font-heading text-base font-semibold leading-snug">
            Keep mentor workloads balanced so every intern gets time and attention.
            {maxInterns ? ` Each mentor can take up to ${maxInterns} interns.` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section>
          <SectionTitle title="Mentor workload" />
          <MentorWorkloadList items={mentors} />
        </section>

        <div className="space-y-5">
          <section>
            <SectionTitle title="Assign a mentor" />
            <AssignMentorPanel
              interns={openInterns}
              mentors={mentors}
              selected={selected}
              canAssign={canAssign}
              onSelect={setSelectedId}
            />
          </section>

          <section>
            <SectionTitle title="Mentor history" />
            <MentorHistoryPanel internId={selected?.internId} />
          </section>
        </div>
      </div>
    </div>
  );
}