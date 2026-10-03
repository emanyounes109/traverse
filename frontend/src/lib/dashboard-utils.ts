export function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Reads profile.fullName defensively, so a different Me shape never crashes the page
export function firstNameOf(me: unknown): string {
  const profile = (me as { profile?: { fullName?: unknown } } | null | undefined)?.profile;
  const full = typeof profile?.fullName === "string" ? profile.fullName.trim() : "";
  return full.split(/\s+/)[0] ?? "";
}

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function deadlineParts(iso: string): { day: string; month: string } {
  const date = new Date(iso);
  return {
    day: pad2(date.getDate()),
    month: date.toLocaleDateString("en-GB", { month: "short" }),
  };
}

// "Due today", "Due tomorrow", "Due in N days" using local calendar days
export function dueLabel(iso: string, now: Date = new Date()): { text: string; urgent: boolean } {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOfDay(new Date(iso)) - startOfDay(now)) / 86_400_000);
  if (diff <= 0) return { text: "Due today", urgent: true };
  if (diff === 1) return { text: "Due tomorrow", urgent: true };
  return { text: `Due in ${diff} days`, urgent: diff <= 3 };
}