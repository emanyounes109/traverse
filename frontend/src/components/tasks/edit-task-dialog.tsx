"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { dateInputToIso, toDateInput } from "@/lib/format";
import { TASK_PRIORITIES, TASK_PRIORITY_LABEL } from "@/config/task-flow";
import { useUpdateTask } from "@/hooks/use-update-task";
import type { UpdateTaskBody } from "@/hooks/use-update-task";
import type { TaskDetail, TaskPriority } from "@/types/tasks";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Props = {
  task: TaskDetail;
  onClose: () => void;
  onSaved: () => void;
};

// Rendered only while open, so the fields start from the current task every time
export function EditTaskDialog({ task, onClose, onSaved }: Props) {
  const update = useUpdateTask(task.id);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [deadline, setDeadline] = useState(toDateInput(task.deadline));
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [error, setError] = useState<string | null>(null);

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
    if (!deadline) {
      setError("Choose a deadline.");
      return;
    }

    // Send only the fields that changed
    const body: UpdateTaskBody = {};
    if (cleanTitle !== task.title) body.title = cleanTitle;
    if (cleanDescription !== task.description) body.description = cleanDescription;
    if (priority !== task.priority) body.priority = priority;

    if (deadline !== toDateInput(task.deadline)) {
      const iso = dateInputToIso(deadline, "end");
      if (new Date(iso).getTime() <= Date.now()) {
        setError("The deadline must be in the future.");
        return;
      }
      body.deadline = iso;
    }

    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    try {
      await update.mutateAsync(body);
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.details?.length ? err.details.join(" ") : err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <Modal open title="Edit task" size="md" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {error && <Alert>{error}</Alert>}

        <Input
          size="sm"
          label="Task title"
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          label="Description"
          rows={4}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            size="sm"
            type="date"
            label="Deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div>
            <label htmlFor="edit-priority" className="mb-1.5 block text-sm font-medium text-ink">
              Priority
            </label>
            <Select
              id="edit-priority"
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
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button compact variant="outline" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button type="submit" compact variant="accent" loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}