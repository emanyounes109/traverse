"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Search, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { getInitials } from "@/lib/initials";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABEL } from "@/config/application-flow";
import { useApplications, useProgramOptions } from "@/hooks/use-applications";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ApplicationStatus } from "@/types/applications";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { StateMessage } from "@/components/ui/state-message";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";

const LIMIT = 7;

// Shared grid so the header and the rows line up
const COLS =
  "grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_48px] items-center gap-4 px-5";

const dateControl =
  "h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export default function ApplicationsPage() {
  const { hasPermission } = useAuth();
  const canReview = hasPermission("CAN_REVIEW_APPLICATIONS");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [programId, setProgramId] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const search = useDebouncedValue(searchInput);

  const { data, isLoading, error } = useApplications(
    { page, limit: LIMIT, search, status, programId, appliedFrom, appliedTo },
    canReview
  );
  const programs = useProgramOptions(canReview);

  if (!canReview) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to review applications."
        />
      </Card>
    );
  }

  const hasFilters = !!(searchInput || status || programId || appliedFrom || appliedTo);

  const clearFilters = () => {
    setSearchInput("");
    setStatus("");
    setProgramId("");
    setAppliedFrom("");
    setAppliedTo("");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Applications / Review"
        title="Applications"
        subtitle="Follow every applicant from first review to final decision."
        aside={
          data ? (
            <p className="text-right">
              <span className="font-heading text-3xl font-extrabold text-ink">
                {data.meta.total}
              </span>{" "}
              <span className="text-sm text-muted">in this view</span>
            </p>
          ) : null
        }
      />

      {/* Filters */}
      <Card padding="sm" className="border-transparent bg-[#e9efec]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search by applicant name or email"
            className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Stage">
            <Select
              className="w-full"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ApplicationStatus | "");
                setPage(1);
              }}
            >
              <option value="">All stages</option>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {APPLICATION_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Program">
            <Select
              className="w-full"
              value={programId}
              onChange={(e) => {
                setProgramId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All programs</option>
              {programs.data?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Applied from">
            <input
              type="date"
              className={dateControl}
              value={appliedFrom}
              onChange={(e) => {
                setAppliedFrom(e.target.value);
                setPage(1);
              }}
            />
          </FilterField>

          <FilterField label="Applied until">
            <input
              type="date"
              className={dateControl}
              value={appliedTo}
              onChange={(e) => {
                setAppliedTo(e.target.value);
                setPage(1);
              }}
            />
          </FilterField>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-xs font-semibold text-ink underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
      </Card>

      {/* Applicant register */}
      <Card padding="none" className="overflow-hidden">
        <div className={`${COLS} border-b border-line bg-canvas/60 py-2 text-xs font-medium text-muted`}>
          <span>Applicant</span>
          <span>Program</span>
          <span>Current stage</span>
          <span>Date applied</span>
          <span />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ) : error ? (
          <StateMessage
            icon={ShieldAlert}
            title="Could not load applications"
            description={error instanceof ApiError ? error.message : undefined}
          />
        ) : data && data.data.length === 0 ? (
          <StateMessage
            icon={FileText}
            title={hasFilters ? "No matching applications" : "No applications yet"}
            description={
              hasFilters
                ? "Try changing or clearing the filters."
                : "Applications appear here as soon as interns apply."
            }
          />
        ) : (
          data?.data.map((a) => (
            <Link
              key={a.id}
              href={`/staff/applications/${a.id}`}
              className={`${COLS} border-b border-line py-3 text-sm transition last:border-b-0 hover:bg-canvas`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {getInitials(a.applicant.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{a.applicant.fullName}</p>
                  <p className="truncate text-xs text-muted">{a.applicant.email}</p>
                </div>
              </div>
              <span className="truncate text-ink">{a.program.name}</span>
              <div>
                <ApplicationStatusBadge status={a.status} />
              </div>
              <span className="font-mono text-xs text-muted">{formatDate(a.appliedAt)}</span>
              <span className="text-right text-sm font-semibold text-ink">View</span>
            </Link>
          ))
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