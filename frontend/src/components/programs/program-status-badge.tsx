import { Badge } from "@/components/ui/badge";
import { PROGRAM_STATUS_META } from "@/config/program-lifecycle";
import type { ProgramStatus } from "@/types/api";

export function ProgramStatusBadge({ status }: { status: ProgramStatus }) {
  const { label, tone } = PROGRAM_STATUS_META[status];

  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}