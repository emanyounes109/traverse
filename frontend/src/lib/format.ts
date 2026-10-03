// "10 Feb 2025"
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ISO string -> "YYYY-MM-DD" in the user's local timezone (for <input type="date">)
export function toDateInput(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "YYYY-MM-DD" -> ISO string with timezone.
// "start" = 00:00 local time, "end" = 23:59 local time.
export function dateInputToIso(value: string, edge: "start" | "end"): string {
  const time = edge === "start" ? "T00:00:00" : "T23:59:00";
  return new Date(`${value}${time}`).toISOString();
}

// Number of weeks between two ISO dates (at least 1)
export function weeksBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.round(ms / (7 * 24 * 60 * 60 * 1000)));
}