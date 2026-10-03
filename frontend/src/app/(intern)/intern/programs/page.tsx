"use client";

import { useMemo, useState } from "react";
import { Briefcase, Loader2, Search, ShieldAlert } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useMyApplications, useOpenPrograms } from "@/hooks/use-opportunities";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { StateMessage } from "@/components/ui/state-message";
import { OpportunityCard } from "@/components/programs/opportunity-card";

const LIMIT = 4;

const SORTS = {
  closing: { sortBy: "applicationCloseDate", order: "asc" },
  newest: { sortBy: "createdAt", order: "desc" },
  name: { sortBy: "name", order: "asc" },
} as const;

type SortKey = keyof typeof SORTS;

export default function OpportunitiesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<SortKey>("closing");
  const search = useDebouncedValue(searchInput);

  const { data, isLoading, error } = useOpenPrograms({
    page,
    limit: LIMIT,
    search,
    ...SORTS[sort],
  });
  const applications = useMyApplications();

  // programId -> the intern's application for that program
  const applicationByProgram = useMemo(
    () => new Map((applications.data?.data ?? []).map((a) => [a.programId, a])),
    [applications.data]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Explore / Opportunities"
        title="Opportunities"
        subtitle="Find a placement where your curiosity can take you further."
        aside={
          data ? (
            <p className="text-right">
              <span className="font-heading text-3xl font-extrabold text-ink">
                {data.meta.total}
              </span>{" "}
              <span className="text-sm text-muted">open now</span>
            </p>
          ) : null
        }
      />

      <div className="rounded-lg bg-brand px-6 py-4 text-white">
        <h2 className="font-heading text-xl font-bold">A new chapter starts here.</h2>
        <p className="mt-1 text-sm text-white/70">
          Explore the teams, the work, and what you&apos;ll learn along the way.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-ink">Available programs</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search programs"
              className="h-9 w-56 rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <Select
            aria-label="Sort programs"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
          >
            <option value="closing">Closing soon</option>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
          </Select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : error ? (
        <Card padding="none">
          <StateMessage
            icon={ShieldAlert}
            title="Could not load opportunities"
            description={error instanceof ApiError ? error.message : undefined}
          />
        </Card>
      ) : data && data.data.length === 0 ? (
        <Card padding="none">
          <StateMessage
            icon={Briefcase}
            title={search ? "No matching programs" : "No open programs right now"}
            description={
              search
                ? "Try a different search."
                : "New opportunities appear here as soon as applications open."
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {data?.data.map((program) => (
              <OpportunityCard
                key={program.id}
                program={program}
                application={applicationByProgram.get(program.id)}
              />
            ))}
          </div>

          {data && data.meta.totalPages > 1 && (
            <Card padding="none">
              <Pagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
                limit={data.meta.limit}
                onChange={setPage}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}