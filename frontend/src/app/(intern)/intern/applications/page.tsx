"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2, ShieldAlert } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { useMyApplicationsPage } from "@/hooks/use-intern-applications";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { StateMessage } from "@/components/ui/state-message";
import { buttonStyles } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";

const LIMIT = 8;

export default function MyApplicationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useMyApplicationsPage(page, LIMIT);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="My applications / All"
        title="Your applications"
        subtitle="Every program you applied to, and where each one stands."
        aside={
          data ? (
            <p className="text-right">
              <span className="font-heading text-3xl font-extrabold text-ink">{data.meta.total}</span>{" "}
              <span className="text-sm text-muted">in total</span>
            </p>
          ) : null
        }
      />

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ) : error ? (
          <StateMessage
            icon={ShieldAlert}
            title="Could not load your applications"
            description={error instanceof ApiError ? error.message : undefined}
          />
        ) : data && data.data.length === 0 ? (
          <StateMessage
            icon={FileText}
            title="No applications yet"
            description="Find a program that fits you and apply in a few clicks."
            action={
              <Link href="/intern/programs" className={buttonStyles("accent", true)}>
                Explore opportunities
              </Link>
            }
          />
        ) : (
          data?.data.map((a) => (
            <Link
              key={a.id}
              href={`/intern/applications/${a.id}`}
              className="flex items-center gap-4 border-b border-line px-5 py-3.5 transition last:border-b-0 hover:bg-canvas"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{a.program.name}</p>
                <p className="font-mono text-[11px] text-muted">
                  #{a.id.slice(0, 8)} / Applied {formatDate(a.appliedAt)}
                </p>
              </div>
              <ApplicationStatusBadge status={a.status} />
              <span className="text-sm font-semibold text-ink">View</span>
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