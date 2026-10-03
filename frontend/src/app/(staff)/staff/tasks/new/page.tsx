"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { dateInputToIso } from "@/lib/format";
import { TASK_PRIORITIES, TASK_PRIORITY_LABEL } from "@/config/task-flow";
import { useActiveInterns, useCreateTask } from "@/hooks/use-tasks";
import type { TaskPriority } from "@/types/tasks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button, buttonStyles } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StateMessage } from "@/components/ui/state-message";

export default function NewTaskPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("CAN_MANAGE_TASKS");

  const interns = useActiveInterns(canManage);
  const create = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [internshipId, setInternshipId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [error, setError] = useState<string | null>(null);

  if (!canManage) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to create tasks."
        />
      </Card>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (cleanTitle.length < 3 || cleanTitle.length > 200) {
      setError("The title must be between 3 and 200 characters.");
      return;
    }
    if (!cleanDescription || cleanDescription.length > 5000) {
      setError("Add a description (up to 5000 characters).");
      return;
    }
    if (!internshipId) {
      setError("Choose an intern.");
      return;
    }
    if (!deadline) {
      setError("Choose a deadline.");
      return;
    }

    // The deadline is the end of the chosen day, and must be in the future
    const deadlineIso = dateInputToIso(deadline, "end");
    if (new Date(deadlineIso).getTime() <= Date.now()) {
      setError("The deadline must be in the future.");
      return;
    }

    try {
      const created = await create.mutateAsync({
        internshipId,
        title: cleanTitle,
        description: cleanDescription,
        deadline: deadlineIso,
        priority,
      });
      router.push(`/staff/tasks/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.details?.length ? err.details.join(" ") : err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/staff/tasks"
        className="inline-flex items-center gap-1 text-xs font-semibold text-ink transition hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to task board
      </Link>

      <PageHeader
        eyebrow="Tasks / New"
        title="Create task"
        subtitle="Set a clear brief, owner, and deadline for the next piece of work."
      />

      <Card>
        <CardHeader title="Task details" divider meta="The new task will start in Pending" />

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {error && <Alert>{error}</Alert>}

          <Input
            size="sm"
            label="Task title"
            placeholder="e.g. Prepare a research summary"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Description"
            rows={4}
            maxLength={5000}
            placeholder="What should the intern deliver?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="intern" className="mb-1.5 block text-sm font-medium text-ink">
                Assign to an active intern
              </label>
              <Select
                id="intern"
                className="h-9 w-full"
                value={internshipId}
                onChange={(e) => setInternshipId(e.target.value)}
              >
                <option value="">
                  {interns.isLoading
                    ? "Loading..."
                    : interns.data && interns.data.data.length === 0
                      ? "No active interns"
                      : "Choose an intern"}
                </option>
                {interns.data?.data.map((i) => (
                  <option key={i.internshipId} value={i.internshipId}>
                    {i.fullName} · {i.program.name}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              size="sm"
              type="date"
              label="Deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="sm:w-1/2">
            <label htmlFor="priority" className="mb-1.5 block text-sm font-medium text-ink">
              Priority
            </label>
            <Select
              id="priority"
              className="w-full"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2 border-t border-line pt-3">
            <Button type="submit" compact variant="accent" loading={create.isPending}>
              Create task
            </Button>
            <Link href="/staff/tasks" className={buttonStyles("outline", true)}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}