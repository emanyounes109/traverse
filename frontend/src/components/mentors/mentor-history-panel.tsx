"use client";

import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { useMentorHistory } from "@/hooks/use-mentors";
import { Card } from "@/components/ui/card";
import { Timeline } from "@/components/ui/timeline";

type Props = {
  internId: string | undefined;
};

export function MentorHistoryPanel({ internId }: Props) {
  const { data, isLoading, error } = useMentorHistory(internId);

  if (!internId) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-muted">
          {error instanceof ApiError ? error.message : "Could not load the mentor history."}
        </p>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">No mentor has been assigned to this intern yet.</p>
      </Card>
    );
  }

  const items = data.map((entry) => ({
    id: entry.id,
    date: formatDate(entry.assignedAt),
    title: `${entry.mentor.fullName ?? "A mentor"} became the mentor.`,
    note: entry.endedAt
      ? `Until ${formatDate(entry.endedAt)} · assigned by ${entry.assignedBy.fullName ?? "staff"}`
      : `Current mentor · assigned by ${entry.assignedBy.fullName ?? "staff"}`,
  }));

  return (
    <Card>
      <Timeline items={items} />
    </Card>
  );
}