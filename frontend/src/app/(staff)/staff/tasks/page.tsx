"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { buttonStyles } from "@/components/ui/button";
import { TasksBoardPage } from "@/components/tasks/tasks-board-page";

export default function StaffTasksPage() {
  const { hasPermission } = useAuth();

  return (
    <TasksBoardPage
      role="STAFF"
      basePath="/staff/tasks"
      eyebrow="Tasks / Board"
      title="Task board"
      subtitle="See what is moving, what needs review, and where someone needs help."
      headerAction={
        hasPermission("CAN_MANAGE_TASKS") ? (
          <Link href="/staff/tasks/new" className={buttonStyles("accent", true)}>
            <Plus className="h-4 w-4" />
            Create task
          </Link>
        ) : null
      }
    />
  );
}