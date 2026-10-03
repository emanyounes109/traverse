"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/types/api";
import type { DocumentMeta } from "@/types/documents";

// Document metadata (name, size...). The file itself is downloaded separately.
export function useDocument(id: string | null | undefined) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => api<DocumentMeta>(`/documents/${id}`),
    enabled: !!id,
  });
}

export interface DocumentsParams {
  type?: "CV" | "INTERNSHIP_DOC";
  internId?: string;
  page?: number;
  limit?: number;
}

// Current versions of the documents the caller may access
export function useDocuments(params: DocumentsParams, enabled = true) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => api<Paginated<DocumentMeta>>("/documents", { query: { ...params } }),
    enabled,
  });
}

function useRefreshDocuments() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["documents"] }),
      qc.invalidateQueries({ queryKey: ["document"] }),
      // The profile carries cvDocumentId, which the apply flow relies on
      qc.invalidateQueries({ queryKey: ["me"] }),
    ]);
}

// First upload of a document (e.g. the intern's CV)
export function useUploadDocument() {
  const refresh = useRefreshDocuments();
  return useMutation({
    mutationFn: ({
      type,
      file,
      internId,
    }: {
      type: "CV" | "INTERNSHIP_DOC";
      file: File;
      internId?: string;
    }) => {
      const form = new FormData();
      // Text fields go before the file so the server can read them first
      form.append("type", type);
      if (internId) form.append("internId", internId);
      form.append("file", file);
      return api<DocumentMeta>("/documents", { method: "POST", formData: form });
    },
    onSuccess: refresh,
  });
}

// Replace a document by uploading a new version
export function useReplaceDocument() {
  const refresh = useRefreshDocuments();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return api<DocumentMeta>(`/documents/${id}/versions`, { method: "POST", formData: form });
    },
    onSuccess: refresh,
  });
}