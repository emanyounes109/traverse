const TONE = {
  steel: "bg-steel",
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
} as const;

type Props = {
  value: number;
  max?: number;
  tone?: keyof typeof TONE;
  className?: string;
};

export function MeterBar({ value, max = 100, tone = "steel", className = "" }: Props) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-line ${className}`}
    >
      <div className={`h-full rounded-full ${TONE[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}