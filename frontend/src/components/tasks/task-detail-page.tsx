"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, SearchX } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useTask, useTaskHistory, useTaskSubmissions } from "@/hooks/use-tasks";
import { Card } from "@/components/ui/card";
import { StateMessage } from "@/components/ui/state-message";
import { buttonStyles } from "@/components/ui/button";
import { TaskDetailView } from "./task-detail-view";
import { InternTaskActions } from "./intern-task-actions";
import { StaffTaskActions } from "./staff-task-actions";

export function TaskDetailPage({ role }: { role: "INTERN" | "STAFF" }) {
  const { id } = useParams<{ id: string }>();
  const task = useTask(id);
  const submissions = useTaskSubmissions(id);
  const history = useTaskHistory(id);

  const backHref = role === "INTERN" ? "/intern/tasks" : "/staff/tasks";

  if (task.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (task.error || !task.data) {
    return (
      <Card padding="none">
        <StateMessage
          icon={SearchX}
          title="Task not found"
          description={task.error instanceof ApiError ? task.error.message : undefined}
          action={
            <Link href={backHref} className={buttonStyles("outline", true)}>
              Back to task board
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <TaskDetailView
      task={task.data}
      submissions={submissions.data ?? []}
      history={history.data ?? []}
      backHref={backHref}
    >
      {role === "INTERN" ? (
        <InternTaskActions task={task.data} />
      ) : (
        <StaffTaskActions task={task.data} />
      )}
    </TaskDetailView>
  );
}