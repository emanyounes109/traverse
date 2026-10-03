import { ReactNode } from "react";

export function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}