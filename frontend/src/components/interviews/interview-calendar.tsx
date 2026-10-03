"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { toDateKey } from "@/lib/format-datetime";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  // First day of the visible month
  month: Date;
  // "YYYY-MM-DD" of the selected day, or null
  selectedDay: string | null;
  // Number of interviews per "YYYY-MM-DD"
  counts: Record<string, number>;
  onMonthChange: (month: Date) => void;
  onSelectDay: (day: string | null) => void;
};

export function InterviewCalendar({ month, selectedDay, counts, onMonthChange, onSelectDay }: Props) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // Weeks start on Monday
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const title = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const arrow =
    "flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink transition hover:bg-canvas";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
          <p className="text-xs text-muted">Choose a day to filter the schedule</p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Previous month"
            className={arrow}
            onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            className={arrow}
            onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-1 font-mono text-[11px] text-muted">
            {d}
          </span>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />;

          const key = toDateKey(new Date(year, monthIndex, day));
          const selected = selectedDay === key;
          const count = counts[key] ?? 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(selected ? null : key)}
              className={`relative flex h-9 items-center justify-center rounded-md text-sm transition ${
                selected
                  ? "bg-primary font-semibold text-white"
                  : key === todayKey
                    ? "border border-accent text-ink hover:bg-canvas"
                    : "bg-canvas/60 text-ink hover:bg-primary-soft"
              }`}
            >
              {day}
              {count > 0 && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? "bg-white" : "bg-steel"}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}