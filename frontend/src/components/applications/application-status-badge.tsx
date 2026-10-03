import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from "@/config/application-flow";
import type { ApplicationStatus } from "@/types/applications";

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge tone={APPLICATION_STATUS_TONE[status]} dot>
      {APPLICATION_STATUS_LABEL[status]}
    </Badge>
  );
}