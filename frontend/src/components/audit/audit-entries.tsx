import { formatDateTime } from "@/lib/format-datetime";
import type { AuditEntityType, AuditEntry } from "@/types/audit";
import { Timeline } from "@/components/ui/timeline";

// "UNDER_REVIEW" -> "Under review"
function humanize(value: string): string {
  const text = value.toLowerCase().replace(/[_-]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function nameOf(value: AuditEntry["mentor"]): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.fullName;
}

function describe(type: AuditEntityType, entry: AuditEntry): string {
  if (type === "mentor-assignments") {
    const mentor = nameOf(entry.mentor) ?? "A mentor";
    const by = nameOf(entry.assignedBy);
    const period = entry.endedAt ? `, until ${formatDateTime(entry.endedAt)}` : " (current mentor)";
    return `${mentor} was assigned${by ? ` by ${by}` : ""}${period}.`;
  }

  let text: string;
  if (entry.fromStatus && entry.toStatus && entry.fromStatus !== entry.toStatus) {
    text = `Moved from ${humanize(entry.fromStatus)} to ${humanize(entry.toStatus)}`;
  } else if (entry.toStatus && !entry.fromStatus) {
    text = entry.action
      ? `${humanize(entry.action)} (${humanize(entry.toStatus)})`
      : `Created as ${humanize(entry.toStatus)}`;
  } else if (entry.action) {
    text = humanize(entry.action);
  } else {
    text = "Updated";
  }

  const by = entry.changedBy?.fullName;
  return `${text}${by ? ` · by ${by}` : ""}.`;
}

type Props = {
  type: AuditEntityType;
  // Oldest first, as returned by the API
  entries: AuditEntry[];
};

export function AuditEntries({ type, entries }: Props) {
  // Newest first for display
  const items = [...entries].reverse().map((entry) => {
    const when = entry.createdAt ?? entry.assignedAt;
    return {
      id: entry.id,
      date: when ? formatDateTime(when) : "",
      title: describe(type, entry),
      note: entry.note,
    };
  });

  return <Timeline items={items} />;
}