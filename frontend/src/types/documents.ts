export interface DocumentMeta {
  id: string;
  type: "CV" | "INTERNSHIP_DOC" | "SUBMISSION";
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  groupId: string;
  isCurrent: boolean;
  internId: string | null;
  uploadedById: string;
  createdAt: string;
}