"use client";

import { ReactNode, useEffect } from "react";

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  size?: keyof typeof sizes;
  children: ReactNode;
};

export function Modal({ open, title, onClose, size = "sm", children }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg border border-line bg-surface p-5 shadow-xl ${sizes[size]}`}
      >
        <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}