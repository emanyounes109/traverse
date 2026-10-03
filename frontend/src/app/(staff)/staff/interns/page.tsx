"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Search, ShieldAlert, Users } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getInitials } from "@/lib/initials";
import {
  INTERNSHIP_STATUSES,
  INTERNSHIP_STATUS_LABEL,
  INTERNSHIP_STATUS_TONE,
} from "@/config/internship-flow";
import { useProgramOptions, useStaffOptions } from "@/hooks/use-applications";
import { useInterns } from "@/hooks/use-interns";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { InternshipStatus } from "@/types/internships";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { FilterField } from "@/components/ui/filter-field";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Pagination } from "@/components/ui/pagination";
import { StateMessage } from "@/components/ui/state-message";

const LIMIT = 7;

const SORTS = {
  newest: { sortBy: "createdAt", order: "desc" },
  name: { sortBy: "fullName", order: "asc" },
  progress: { sortBy: "progress", order: "desc" },
  started: { sortBy: "startedAt", order: "desc" },
} as const;

type SortKey = keyof typeof SORTS;

// Shared grid so the header and the rows line up
const COLS =
  "grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] items-center gap-4 px-5";

export default function InternsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [program, setProgram] = useState("");
  const [mentor, setMentor] = useState("");
  const [status, setStatus] = useState<InternshipStatus | "">("");
  const [sort, setSort] = useState<SortKey>("newest");
  const search = useDebouncedValue(searchInput);

  const { data, isLoading, error } = useInterns({
    page,
    limit: LIMIT,
    search,
    program,
    mentor,
    status,
    ...SORTS[sort],
  });
  const programs = useProgramOptions(true);
  const staff = useStaffOptions(true);

  const hasFilters = !!(searchInput || program || mentor || status);

  const clearFilters = () => {
    setSearchInput("");
    setProgram("");
    setMentor("");
    setStatus("");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Interns / Placements"
        title="Interns"
        subtitle="A clear view of every placement, person, and next step."
        aside={
          data ? (
            <p className="text-right">
              <span className="font-heading text-3xl font-extrabold text-ink">{data.meta.total}</span>{" "}
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
            placeholder="Search by name or email"
            className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Program">
            <Select
              className="w-full"
              value={program}
              onChange={(e) => {
                setProgram(e.target.value);
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

          <FilterField label="Mentor">
            <Select
              className="w-full"
              value={mentor}
              onChange={(e) => {
                setMentor(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All mentors</option>
              {staff.data?.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Status">
            <Select
              className="w-full"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as InternshipStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {INTERNSHIP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {INTERNSHIP_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Sort by">
            <Select
              className="w-full"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
                setPage(1);
              }}
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="progress">Progress</option>
              <option value="started">Start date</option>
            </Select>
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

      {/* Placement register */}
      <Card padding="none" className="overflow-hidden">
        <div className={`${COLS} border-b border-line bg-canvas/60 py-2 text-xs font-medium text-muted`}>
          <span>Intern</span>
          <span>Program</span>
          <span>Mentor</span>
          <span>Status</span>
          <span>Progress</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ) : error ? (
          <StateMessage
            icon={ShieldAlert}
            title="Could not load interns"
            description={error instanceof ApiError ? error.message : undefined}
          />
        ) : data && data.data.length === 0 ? (
          <StateMessage
            icon={Users}
            title={hasFilters ? "No matching interns" : "No interns yet"}
            description={
              hasFilters
                ? "Try changing or clearing the filters."
                : "Interns appear here once their applications are accepted."
            }
          />
        ) : (
          data?.data.map((i) => (
            <Link
              key={i.internshipId}
              href={`/staff/interns/${i.internId}`}
              className={`${COLS} border-b border-line py-3 text-sm transition last:border-b-0 hover:bg-canvas`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {getInitials(i.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{i.fullName}</p>
                  <p className="truncate text-xs text-muted">{i.email}</p>
                </div>
              </div>
              <span className="truncate text-ink">{i.program.name}</span>
              <span className={`truncate ${i.mentor ? "text-ink" : "text-muted"}`}>
                {i.mentor?.fullName ?? "Unassigned"}
              </span>
              <div>
                <Badge tone={INTERNSHIP_STATUS_TONE[i.status]} dot>
                  {INTERNSHIP_STATUS_LABEL[i.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar value={i.progress} />
                <span className="w-9 shrink-0 text-right font-mono text-xs text-muted">{i.progress}%</span>
              </div>
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