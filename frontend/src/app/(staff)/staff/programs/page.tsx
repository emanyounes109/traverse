"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, Loader2, Plus, Search, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { usePrograms } from "@/hooks/use-programs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PROGRAM_STATUSES, PROGRAM_STATUS_META } from "@/config/program-lifecycle";
import type { ProgramStatus } from "@/types/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StateMessage } from "@/components/ui/state-message";
import { buttonStyles } from "@/components/ui/button";
import { ProgramStatusBadge } from "@/components/programs/program-status-badge";

const LIMIT = 8;

// Shared grid so the header and the rows line up
const COLS =
  "grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-4 px-5";

export default function ProgramsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("CAN_MANAGE_PROGRAMS");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<ProgramStatus | "">("");
  const search = useDebouncedValue(searchInput);

  const { data, isLoading, error } = usePrograms({ page, limit: LIMIT, search, status });

  if (!canManage) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to manage programs."
        />
      </Card>
    );
  }

  const newProgramLink = (
    <Link href="/staff/programs/new" className={buttonStyles("accent", true)}>
      <Plus className="h-4 w-4" />
      New program
    </Link>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Programs / All placements"
        title="Programs"
        subtitle="Create and manage internship programs."
        aside={newProgramLink}
      />

      <Card padding="none" className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search programs"
              className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ProgramStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {PROGRAM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROGRAM_STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </div>

        {/* Column headers */}
        <div className={`${COLS} border-b border-line bg-canvas/60 py-2 text-xs font-medium text-muted`}>
          <span>Program</span>
          <span>Applications</span>
          <span>Placement</span>
          <span>Seats</span>
          <span>Status</span>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ) : error ? (
          <StateMessage
            icon={ShieldAlert}
            title="Could not load programs"
            description={error instanceof ApiError ? error.message : undefined}
          />
        ) : data && data.data.length === 0 ? (
          <StateMessage
            icon={Layers}
            title={search || status ? "No matching programs" : "No programs yet"}
            description={
              search || status
                ? "Try a different search or filter."
                : "Create your first program to start receiving applications."
            }
            action={!search && !status ? newProgramLink : undefined}
          />
        ) : (
          data?.data.map((p) => {
            const filled = p.capacity > 0 ? (p.acceptedCount / p.capacity) * 100 : 0;

            return (
              <Link
                key={p.id}
                href={`/staff/programs/${p.id}`}
                className={`${COLS} border-b border-line py-3 text-sm transition last:border-b-0 hover:bg-canvas`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{p.name}</p>
                  <p className="font-mono text-[11px] text-muted">#{p.id.slice(0, 8)}</p>
                </div>
                <span className="text-xs text-muted">
                  {formatDate(p.applicationOpenDate)} – {formatDate(p.applicationCloseDate)}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(p.internshipStartDate)} – {formatDate(p.internshipEndDate)}
                </span>
                <div>
                  <p className="text-xs">
                    <span className="font-semibold text-ink">{p.acceptedCount}</span>
                    <span className="text-muted"> / {p.capacity}</span>
                  </p>
                  <ProgressBar value={filled} className="mt-1.5" />
                </div>
                <div>
                  <ProgramStatusBadge status={p.status} />
                </div>
              </Link>
            );
          })
        )}

        {data && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={data.meta.limit}
            onChange={setPage}
          />
        )}
      </Card>
    </div>
  );
}