import { TasksBoardPage } from "@/components/tasks/tasks-board-page";

export default function InternTasksPage() {
  return (
    <TasksBoardPage
      role="INTERN"
      basePath="/intern/tasks"
      eyebrow="Tasks / Board"
      title="Your task board"
      subtitle="Follow your work from first draft to approved."
    />
  );
}