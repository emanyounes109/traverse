"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StateMessage } from "@/components/ui/state-message";
import { ProgramForm } from "@/components/programs/program-form";

export default function NewProgramPage() {
  const { hasPermission } = useAuth();

  if (!hasPermission("CAN_MANAGE_PROGRAMS")) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to create programs."
        />
      </Card>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/staff/programs"
        className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All programs
      </Link>

      <PageHeader
        eyebrow="Programs / New"
        title="New program"
        subtitle="Programs start as drafts. Publish when you are ready to open applications."
      />

      <Card>
        <CardHeader title="Program details" divider />
        <ProgramForm mode="create" />
      </Card>
    </div>
  );
}