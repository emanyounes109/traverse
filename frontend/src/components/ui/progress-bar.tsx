type Props = {
  // 0 - 100
  value: number;
  className?: string;
};

export function ProgressBar({ value, className = "" }: Props) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-line ${className}`}
    >
      <div className="h-full rounded-full bg-steel" style={{ width: `${pct}%` }} />
    </div>
  );
}