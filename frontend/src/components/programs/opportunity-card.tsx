import Link from "next/link";
import { CalendarDays, Clock, Users } from "lucide-react";
import { formatDate, weeksBetween } from "@/lib/format";
import type { Program } from "@/types/api";
import type { Application } from "@/types/applications";
import { Card } from "@/components/ui/card";
import { getOpportunityState, OpportunityBadge } from "./opportunity-status";

type Props = {
  program: Program;
  // Set when the intern already applied to this program
  application?: Application;
};

export function OpportunityCard({ program, application }: Props) {
  const state = getOpportunityState(program, !!application);
  const weeks = weeksBetween(program.internshipStartDate, program.internshipEndDate);
  const href = application
    ? `/intern/applications/${application.id}`
    : `/intern/programs/${program.id}`;

  return (
    <Card className="flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] text-muted">
          Starts {formatDate(program.internshipStartDate)} / #{program.id.slice(0, 8)}
        </p>
        <OpportunityBadge state={state} />
      </div>

      <h3 className="font-heading text-lg font-bold leading-tight text-ink">{program.name}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{program.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {weeks} weeks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          Apply by {formatDate(program.applicationCloseDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {program.seatsLeft} places left
        </span>
      </div>

      <Link
        href={href}
        className="mt-auto pt-4 text-sm font-semibold text-ink underline underline-offset-4"
      >
        {application ? "View application" : "View opportunity"}
      </Link>
    </Card>
  );
}