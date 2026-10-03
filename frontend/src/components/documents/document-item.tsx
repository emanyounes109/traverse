"use client";

import { ReactNode, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { openDocument } from "@/lib/download";

type Props = {
  documentId: string;
  title: string;
  subtitle: string;
  // Extra actions shown after "View" (e.g. Replace)
  actions?: ReactNode;
};

export function DocumentItem({ documentId, title, subtitle, actions }: Props) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleView = async () => {
    setOpening(true);
    setError(null);
    try {
      await openDocument(documentId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not open the file.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-steel/10 text-steel">
          <FileText className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{title}</p>
          <p className="truncate text-xs text-muted">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={handleView}
            disabled={opening}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 disabled:opacity-60"
          >
            {opening && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            View
          </button>
          {actions}
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}