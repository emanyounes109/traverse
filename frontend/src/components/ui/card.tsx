import { HTMLAttributes, ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";

const paddings: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: Padding;
};

export function Card({ padding = "md", className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-line bg-surface ${paddings[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title: ReactNode;
  // Small monospace label shown above the title
  eyebrow?: ReactNode;
  // Anything rendered on the right side (label, badge, link...)
  meta?: ReactNode;
  // Adds a bottom border and spacing under the header
  divider?: boolean;
};

export function CardHeader({ title, eyebrow, meta, divider = false }: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${
        divider ? "mb-4 border-b border-line pb-3" : "mb-3"
      }`}
    >
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 font-mono text-[11px] text-muted">{eyebrow}</p>}
        <h2 className="font-heading text-lg font-bold leading-tight text-ink">{title}</h2>
      </div>
      {meta && <div className="shrink-0 font-mono text-[11px] text-muted">{meta}</div>}
    </div>
  );
}