import { api, ApiError } from "@/lib/api/client";
import type { DocumentMeta } from "@/types/documents";

type DocumentWithUrl = DocumentMeta & { downloadUrl: string };

// Asks for a fresh short-lived link, then fetches the file with the auth cookie
async function fetchDocumentBlob(id: string): Promise<{ blob: Blob; name: string }> {
  const meta = await api<DocumentWithUrl>(`/documents/${id}`);

  const res = await fetch(meta.downloadUrl, { credentials: "include" });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      data?.code ?? "DOWNLOAD_FAILED",
      data?.message ?? "Could not download the file."
    );
  }

  return { blob: await res.blob(), name: meta.originalName };
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = name;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadDocument(id: string): Promise<void> {
  const { blob, name } = await fetchDocumentBlob(id);
  saveBlob(blob, name);
}

// Opens the file in a new tab (falls back to a download if popups are blocked)
export async function openDocument(id: string): Promise<void> {
  // Open the tab synchronously so popup blockers allow it, then point it at the file
  const tab = window.open("", "_blank");

  try {
    const { blob, name } = await fetchDocumentBlob(id);

    if (!tab) {
      saveBlob(blob, name);
      return;
    }

    // The blob URL is not revoked here because the new tab still needs it
    tab.location.href = URL.createObjectURL(blob);
  } catch (e) {
    tab?.close();
    throw e;
  }
}