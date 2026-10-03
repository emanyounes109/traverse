import { Check } from "lucide-react";

type Props = {
  steps: string[];
  // Index of the current step (0-based). Use steps.length when everything is done.
  current: number;
  // Color of the current step (use "danger" for rejected flows)
  currentTone?: "accent" | "danger";
};

export function Stepper({ steps, current, currentTone = "accent" }: Props) {
  const currentStyle =
    currentTone === "danger" ? "bg-danger text-white" : "bg-accent text-ink";

  return (
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;

        const style = done
          ? "bg-steel text-white"
          : active
            ? currentStyle
            : "border border-line bg-surface text-muted";

        return (
          <li key={label} className="flex min-w-0 flex-1 items-center">
            <div
              aria-current={active ? "step" : undefined}
              className={`flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold ${style}`}
            >
              {done && <Check className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <span className={`h-px w-3 shrink-0 ${done ? "bg-steel" : "bg-line"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}