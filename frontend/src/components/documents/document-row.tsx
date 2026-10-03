"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { downloadDocument } from "@/lib/download";
import { useDocument } from "@/hooks/use-documents";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type Props = {
  documentId: string;
  // Label shown above the file name, e.g. "Curriculum vitae"
  title: string;
};

export function DocumentRow({ documentId, title }: Props) {
  const { data: doc, isLoading, error } = useDocument(documentId);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadDocument(documentId);
    } catch (e) {
      setDownloadError(e instanceof ApiError ? e.message : "Could not download the file.");
    } finally {
      setDownloading(false);
    }
  };

  const subtitle = isLoading
    ? "Loading..."
    : error || !doc
      ? "Could not load file details"
      : `${doc.originalName} · ${formatBytes(doc.sizeBytes)}`;

  return (
    <div>
      <div className="flex items-center gap-3 rounded-md border border-line bg-canvas/50 px-3 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-steel/10 text-steel">
          <FileText className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="truncate text-xs text-muted">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || !doc}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download
        </button>
      </div>

      {downloadError && <p className="mt-1 text-xs text-danger">{downloadError}</p>}
    </div>
  );
}