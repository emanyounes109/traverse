import { Badge } from "@/components/ui/badge";
import type { Program } from "@/types/api";

export type OpportunityState = "open" | "applied" | "closed";

// True while the program is OPEN and today is inside the application window
export function isApplicationWindowOpen(program: Program, now: Date = new Date()): boolean {
  return (
    program.status === "OPEN" &&
    new Date(program.applicationOpenDate) <= now &&
    now <= new Date(program.applicationCloseDate)
  );
}

export function getOpportunityState(program: Program, applied: boolean): OpportunityState {
  if (applied) return "applied";
  return isApplicationWindowOpen(program) ? "open" : "closed";
}

export function OpportunityBadge({ state }: { state: OpportunityState }) {
  if (state === "applied") {
    return (
      <Badge tone="steel" dot>
        Already applied
      </Badge>
    );
  }
  if (state === "open") {
    return (
      <Badge tone="accent" dot>
        Applications open
      </Badge>
    );
  }
  return (
    <Badge tone="neutral" dot>
      Applications closed
    </Badge>
  );
}