import { initialsOf } from "@/lib/dashboard-utils";
import type { MentorWorkloadItem } from "@/types/mentors";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MeterBar } from "@/components/dashboard/meter-bar";

type Props = {
  items: MentorWorkloadItem[];
};

export function MentorWorkloadList({ items }: Props) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">There is no active staff to mentor yet.</p>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <ul>
        {items.map((mentor) => {
          const ratio = mentor.maxInterns > 0 ? mentor.activeInternCount / mentor.maxInterns : 0;
          const tone = mentor.atCapacity ? "danger" : ratio >= 0.7 ? "accent" : "primary";

          return (
            <li key={mentor.id} className="border-b border-line p-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-heading text-sm font-bold text-ink">
                  {initialsOf(mentor.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{mentor.fullName}</p>
                  <p className="truncate text-xs text-muted">{mentor.workEmail}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-2xl font-bold leading-none text-ink">
                    {mentor.activeInternCount}
                  </p>
                  <p className="text-xs text-muted">interns</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <MeterBar value={mentor.activeInternCount} max={mentor.maxInterns} tone={tone} />
                <span className="shrink-0 font-mono text-[11px] text-muted">max {mentor.maxInterns}</span>
                {mentor.atCapacity && <Badge tone="danger">At capacity</Badge>}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}