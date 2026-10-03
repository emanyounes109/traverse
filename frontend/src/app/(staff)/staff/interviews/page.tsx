"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Loader2, Plus, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { toDateInput } from "@/lib/format";
import { toDateKey } from "@/lib/format-datetime";
import { INTERVIEW_STATUSES, INTERVIEW_STATUS_LABEL } from "@/config/interview-flow";
import { useInterviews } from "@/hooks/use-interviews";
import type { InterviewStatus } from "@/types/applications";
import type { InterviewListItem } from "@/types/interviews";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StateMessage } from "@/components/ui/state-message";
import { InterviewCalendar } from "@/components/interviews/interview-calendar";
import { InterviewCard } from "@/components/interviews/interview-card";
import type { InterviewAction } from "@/components/interviews/interview-card";
import { InterviewActionDialog } from "@/components/interviews/interview-action-dialog";
import { NewInterviewDialog } from "@/components/interviews/new-interview-dialog";

export default function InterviewsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("CAN_MANAGE_INTERVIEWS");
  const canView = canManage || hasPermission("CAN_REVIEW_APPLICATIONS");

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [status, setStatus] = useState<InterviewStatus | "">("");
  const [dialog, setDialog] = useState<{ interview: InterviewListItem; action: InterviewAction } | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  // Ask for one extra day on each side so timezone differences cannot hide edge interviews,
  // then keep only the interviews that fall in the visible month (local time)
  const from = toDateKey(new Date(year, monthIndex, 0));
  const to = toDateKey(new Date(year, monthIndex + 1, 1));

  const { data, isLoading, error } = useInterviews(
    { page: 1, limit: 100, from, to, status, sortBy: "scheduledAt", order: "asc" },
    canView
  );

  const inMonth = useMemo(
    () => (data?.data ?? []).filter((i) => toDateInput(i.scheduledAt).startsWith(monthPrefix)),
    [data, monthPrefix]
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    inMonth.forEach((i) => {
      const key = toDateInput(i.scheduledAt);
      result[key] = (result[key] ?? 0) + 1;
    });
    return result;
  }, [inMonth]);

  const visible = selectedDay
    ? inMonth.filter((i) => toDateInput(i.scheduledAt) === selectedDay)
    : inMonth;

  if (!canView) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to interviews."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Interviews / Schedule"
        title="Interview schedule"
        subtitle="Find a time, prepare the team, and keep every conversation on record."
        aside={
          canManage ? (
            <Button compact variant="accent" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />
              Schedule interview
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="self-start">
          <InterviewCalendar
            month={month}
            selectedDay={selectedDay}
            counts={counts}
            onMonthChange={(m) => {
              setMonth(m);
              setSelectedDay(null);
            }}
            onSelectDay={setSelectedDay}
          />
        </Card>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h2 className="font-heading text-lg font-bold text-ink">Interview records</h2>
              <span className="font-mono text-[11px] text-muted">{visible.length} records</span>
            </div>
            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value as InterviewStatus | "")}
            >
              <option value="">All statuses</option>
              {INTERVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {INTERVIEW_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : error ? (
            <Card padding="none">
              <StateMessage
                icon={ShieldAlert}
                title="Could not load interviews"
                description={error instanceof ApiError ? error.message : undefined}
              />
            </Card>
          ) : visible.length === 0 ? (
            <Card padding="none">
              <StateMessage
                icon={CalendarDays}
                title={selectedDay ? "No interviews on this day" : "No interviews this month"}
                description="Scheduled interviews will appear here."
              />
            </Card>
          ) : (
            <div className="max-h-[calc(100vh-17rem)] space-y-3 overflow-y-auto pr-1">
              {visible.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  canManage={canManage}
                  onAction={(action) => setDialog({ interview, action })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {dialog && (
        <InterviewActionDialog
          key={`${dialog.interview.id}-${dialog.action}`}
          interview={dialog.interview}
          action={dialog.action}
          onClose={() => setDialog(null)}
        />
      )}
      {newOpen && <NewInterviewDialog onClose={() => setNewOpen(false)} />}
    </div>
  );
}