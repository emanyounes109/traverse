"use client";

import { useEffect } from "react";
import { Button } from "./button";
import { Alert } from "./alert";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "accent" | "danger";
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "accent",
  loading = false,
  error,
  onConfirm,
  onCancel,
}: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-line bg-surface p-5 shadow-xl"
      >
        <h2 id="confirm-title" className="font-heading text-lg font-bold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{description}</p>

        {error && (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button compact variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            compact
            variant={tone === "danger" ? "danger" : "accent"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}