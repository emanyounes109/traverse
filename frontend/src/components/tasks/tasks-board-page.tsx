"use client";

import { ReactNode, useState } from "react";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useTasksBoard } from "@/hooks/use-tasks";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StateMessage } from "@/components/ui/state-message";
import { TaskBoard } from "./task-board";

type Props = {
  role: "INTERN" | "STAFF";
  basePath: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  // Extra action next to the counter (e.g. the Create task button)
  headerAction?: ReactNode;
};

export function TasksBoardPage({ role, basePath, eyebrow, title, subtitle, headerAction }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);
  const { data, isLoading, error } = useTasksBoard(role, search);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        aside={
          <div className="flex items-center gap-4">
            {data && (
              <p className="text-right">
                <span className="font-heading text-3xl font-extrabold text-ink">{data.meta.total}</span>{" "}
                <span className="text-sm text-muted">tasks in view</span>
              </p>
            )}
            {headerAction}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={role === "STAFF" ? "Find a task or intern" : "Find a task"}
            className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <p className="text-xs text-muted">Open a task to see details and take the next step.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : error ? (
        <Card padding="none">
          <StateMessage
            icon={ShieldAlert}
            title="Could not load tasks"
            description={error instanceof ApiError ? error.message : undefined}
          />
        </Card>
      ) : (
        <TaskBoard tasks={data?.data ?? []} basePath={basePath} showIntern={role === "STAFF"} />
      )}
    </div>
  );
}