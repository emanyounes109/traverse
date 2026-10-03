"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ScrollText, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { useAuditEntries, useAuditRecords } from "@/hooks/use-audit";
import type { AuditEntityType } from "@/types/audit";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { FilterField } from "@/components/ui/filter-field";
import { StateMessage } from "@/components/ui/state-message";
import { AuditEntries } from "@/components/audit/audit-entries";

const TYPE_LABEL: Record<AuditEntityType, string> = {
  application: "Application",
  interview: "Interview",
  internship: "Internship",
  task: "Task",
  "mentor-assignments": "Mentor assignments",
};

const VALID_TYPES = Object.keys(TYPE_LABEL) as AuditEntityType[];

// Reads ?type= from the URL (used by "View audit history" links)
function parseType(value: string | null): AuditEntityType | "" {
  return VALID_TYPES.find((t) => t === value) ?? "";
}

function AuditView() {
  const params = useSearchParams();
  const { hasPermission } = useAuth();
  const canView = hasPermission("CAN_VIEW_AUDIT");

  const [type, setType] = useState<AuditEntityType | "">(() => parseType(params.get("type")));
  const [recordId, setRecordId] = useState(() => params.get("id") ?? "");

  const records = useAuditRecords(type, canView);
  const audit = useAuditEntries(type, recordId, canView);

  if (!canView) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to the audit history."
        />
      </Card>
    );
  }

  // Which record types this person can open (the API checks again on every request)
  const typeOptions = [
    { value: "application", ok: hasPermission("CAN_REVIEW_APPLICATIONS") },
    {
      value: "interview",
      ok: hasPermission("CAN_REVIEW_APPLICATIONS") || hasPermission("CAN_MANAGE_INTERVIEWS"),
    },
    { value: "internship", ok: true },
    { value: "task", ok: true },
    { value: "mentor-assignments", ok: true },
  ].filter((t) => t.ok) as { value: AuditEntityType; ok: boolean }[];

  const options = records.data ?? [];
  // A record opened from a deep link may not be in the first 100 results
  const missingCurrent = !!recordId && !options.some((o) => o.id === recordId);

  const entryCount = audit.data?.entries.length;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Audit / History"
        title="Audit history"
        subtitle="See who changed what, and when."
        aside={
          entryCount !== undefined ? (
            <p className="text-right">
              <span className="font-heading text-3xl font-extrabold text-ink">{entryCount}</span>{" "}
              <span className="text-sm text-muted">entries</span>
            </p>
          ) : null
        }
      />

      <Card padding="sm" className="border-transparent bg-[#e9efec]">
        <div className="grid gap-3 sm:grid-cols-2">
          <FilterField label="Record type">
            <Select
              className="w-full"
              value={type}
              onChange={(e) => {
                setType(e.target.value as AuditEntityType | "");
                setRecordId("");
              }}
            >
              <option value="">Choose a record type</option>
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {TYPE_LABEL[t.value]}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Record">
            <Select
              className="w-full"
              value={recordId}
              disabled={!type}
              onChange={(e) => setRecordId(e.target.value)}
            >
              <option value="">
                {!type ? "Choose a type first" : records.isLoading ? "Loading..." : "Choose a record"}
              </option>
              {missingCurrent && <option value={recordId}>Record #{recordId.slice(0, 8)}</option>}
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FilterField>
        </div>
      </Card>

      <Card padding="none">
        {!type || !recordId ? (
          <StateMessage
            icon={ScrollText}
            title="Choose a record"
            description="Pick a record type and a record to see its full change history."
          />
        ) : audit.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ) : audit.error ? (
          <StateMessage
            icon={ShieldAlert}
            title="Could not load the history"
            description={audit.error instanceof ApiError ? audit.error.message : undefined}
          />
        ) : audit.data && audit.data.entries.length === 0 ? (
          <StateMessage icon={ScrollText} title="No history yet" />
        ) : (
          audit.data && (
            <div className="p-5">
              <CardHeader title={TYPE_LABEL[type]} eyebrow={`#${recordId.slice(0, 8)}`} divider />
              <AuditEntries type={type} entries={audit.data.entries} />
            </div>
          )
        )}
      </Card>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for production builds
export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      }
    >
      <AuditView />
    </Suspense>
  );
}