import { Badge } from "@/components/ui/badge";
import {
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_TONE,
  TASK_STATUS_LABEL,
  TASK_STATUS_TONE,
} from "@/config/task-flow";
import type { TaskPriority, TaskStatus } from "@/types/tasks";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge tone={TASK_STATUS_TONE[status]} dot>
      {TASK_STATUS_LABEL[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge tone={TASK_PRIORITY_TONE[priority]}>{TASK_PRIORITY_LABEL[priority]}</Badge>;
}