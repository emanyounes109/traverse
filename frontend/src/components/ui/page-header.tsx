import { ReactNode } from "react";

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  // Content on the right side (badge, button...)
  aside?: ReactNode;
};

export function PageHeader({ title, eyebrow, subtitle, aside }: Props) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 font-mono text-[11px] text-muted">
            <span className="h-px w-5 bg-accent" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-2xl font-extrabold leading-tight tracking-tight text-ink">
          {title}
          <span className="text-accent">.</span>
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}