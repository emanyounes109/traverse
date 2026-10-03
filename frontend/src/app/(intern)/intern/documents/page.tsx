"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { formatBytes } from "@/lib/format-bytes";
import { useDocuments, useReplaceDocument, useUploadDocument } from "@/hooks/use-documents";
import { useMyInternship } from "@/hooks/use-profile";
import type { InternProfile } from "@/types/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { FileButton } from "@/components/ui/file-button";
import { buttonStyles } from "@/components/ui/button";
import { DocumentItem } from "@/components/documents/document-item";
import { ProfileDetailsCard } from "@/components/profile/profile-details-card";

const FORMATS_NOTE = "Accepted formats: PDF, DOC, or DOCX · Maximum 10 MB";

export default function InternDocumentsPage() {
  const { me } = useAuth();

  const cvs = useDocuments({ type: "CV", limit: 1 });
  const placementDocs = useDocuments({ type: "INTERNSHIP_DOC", limit: 50 });
  const internship = useMyInternship(true);
  const upload = useUploadDocument();
  const replace = useReplaceDocument();

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!me || me.user.role !== "INTERN") return null;

  const profile = me.profile as InternProfile;
  const cv = cvs.data?.data[0];
  const busy = upload.isPending || replace.isPending;

  const handleCvFile = async (file: File) => {
    setError(null);
    setNotice(null);
    try {
      if (cv) {
        await replace.mutateAsync({ id: cv.id, file });
        setNotice("Your CV was updated.");
      } else {
        await upload.mutateAsync({ type: "CV", file });
        setNotice("Your CV was uploaded.");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not upload the file. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="My workspace / Profile"
        title="Profile & documents"
        subtitle="Keep your details ready for applications and your placement."
        aside={
          cvs.isLoading ? null : cv ? (
            <Badge tone="success" dot>
              CV ready
            </Badge>
          ) : (
            <Badge tone="accent" dot>
              CV needed
            </Badge>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <ProfileDetailsCard
            email={me.user.email}
            profile={profile}
            placementName={internship.data?.program.name}
          />

          <Card>
            <CardHeader title="Application document" divider meta="Required to apply" />

            {error && (
              <div className="mb-3">
                <Alert>{error}</Alert>
              </div>
            )}
            {notice && (
              <div className="mb-3">
                <Alert variant="success">{notice}</Alert>
              </div>
            )}

            {cv ? (
              <DocumentItem
                documentId={cv.id}
                title="Curriculum vitae"
                subtitle={`${cv.originalName} · ${formatBytes(cv.sizeBytes)}${cv.version > 1 ? ` · Version ${cv.version}` : ""}`}
                actions={
                  <FileButton loading={busy} onFile={handleCvFile} onError={setError}>
                    Replace
                  </FileButton>
                }
              />
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-line bg-canvas/50 p-4">
                <p className="text-sm text-muted">
                  {cvs.isLoading
                    ? "Loading..."
                    : "You haven't uploaded a CV yet. Programs need it to consider your application."}
                </p>
                {!cvs.isLoading && (
                  <FileButton kind="button" loading={busy} onFile={handleCvFile} onError={setError}>
                    Upload CV
                  </FileButton>
                )}
              </div>
            )}

            <p className="mt-3 text-xs text-muted">{FORMATS_NOTE}</p>
          </Card>

          <Card>
            <CardHeader title="Placement documents" divider meta="Your internship files" />

            {placementDocs.data && placementDocs.data.data.length > 0 ? (
              <ul className="space-y-3">
                {placementDocs.data.data.map((doc) => (
                  <li key={doc.id}>
                    <DocumentItem
                      documentId={doc.id}
                      title={doc.originalName}
                      subtitle={`${formatBytes(doc.sizeBytes)} · Added ${formatDate(doc.createdAt)}`}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-3 text-sm text-muted">
                <FileText className="h-4 w-4 shrink-0" />
                {placementDocs.isLoading
                  ? "Loading..."
                  : "Your placement documents will appear here once your team shares them."}
              </div>
            )}
          </Card>
        </div>

        <Card className="self-start border-transparent bg-[#e9efec]">
          <p className="font-mono text-[11px] text-muted">A good place to start</p>
          <p className="mt-2 font-heading text-xl font-bold leading-snug text-ink">
            Ready for what&apos;s next.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your CV is shared when you submit an application. Placement documents are kept together
            here so you can find them when you need them.
          </p>
          <Link href="/intern/programs" className={`${buttonStyles("outline", true)} mt-4`}>
            Explore opportunities
          </Link>
        </Card>
      </div>
    </div>
  );
}