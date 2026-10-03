import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { TASK_STATUSES, TASK_STATUS_DOT, TASK_STATUS_LABEL } from "@/config/task-flow";
import type { TaskListItem } from "@/types/tasks";
import { PriorityBadge } from "./task-badges";

type Props = {
  tasks: TaskListItem[];
  // Where a task card links to, e.g. "/intern/tasks"
  basePath: string;
  // Show the intern's name on each card (staff view)
  showIntern: boolean;
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function TaskBoard({ tasks, basePath, showIntern }: Props) {
  return (
    <div className="grid auto-cols-[minmax(210px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
      {TASK_STATUSES.map((status) => {
        const items = tasks.filter((t) => t.status === status);

        return (
          <section
            key={status}
            className="flex max-h-[calc(100vh-19rem)] min-h-[160px] flex-col rounded-lg bg-[#eef0ec] p-2.5"
          >
            <header className="flex items-center justify-between px-1 pb-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className={`h-2 w-2 rounded-sm ${TASK_STATUS_DOT[status]}`} />
                {TASK_STATUS_LABEL[status]}
              </span>
              <span className="font-mono text-xs text-muted">{items.length}</span>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {items.length === 0 ? (
                <div className="rounded-md border border-dashed border-line px-3 py-4">
                  <p className="text-xs text-muted">No tasks here.</p>
                </div>
              ) : (
                items.map((task) => (
                  <Link
                    key={task.id}
                    href={`${basePath}/${task.id}`}
                    className="block rounded-md border border-line bg-surface p-3 transition hover:border-primary/40 hover:shadow-sm"
                  >
                    <p className="font-mono text-[10px] text-muted">#{task.id.slice(0, 8)}</p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-ink">{task.title}</p>
                    {showIntern && <p className="mt-1 text-xs text-muted">{task.intern.fullName}</p>}

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                          task.isOverdue ? "font-semibold text-danger" : "text-muted"
                        }`}
                      >
                        <CalendarDays className="h-3 w-3" />
                        {shortDate(task.deadline)}
                        {task.isOverdue && " · Overdue"}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}