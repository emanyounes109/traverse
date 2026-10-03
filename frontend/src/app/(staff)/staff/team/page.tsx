"use client";

import { useState } from "react";
import { Loader2, Search, ShieldAlert, UserCheck, Users } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { getInitials } from "@/lib/initials";
import { useActiveStaff, usePendingStaff } from "@/hooks/use-staff";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ManagedStaff, PendingStaff } from "@/types/staff";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { StateMessage } from "@/components/ui/state-message";
import { PermissionsDialog } from "@/components/staff/permissions-dialog";

const LIMIT = 8;

type Tab = "pending" | "active";

type Target =
  | { mode: "approve"; staff: PendingStaff }
  | { mode: "edit"; staff: ManagedStaff };

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
      {getInitials(name)}
    </div>
  );
}

export default function TeamPage() {
  const { me, hasPermission } = useAuth();
  const canManage = hasPermission("CAN_MANAGE_USERS");

  const [tab, setTab] = useState<Tab>("pending");
  const [pendingPage, setPendingPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const search = useDebouncedValue(searchInput);

  const pending = usePendingStaff({ page: pendingPage, limit: LIMIT }, canManage);
  const active = useActiveStaff({ page: activePage, limit: LIMIT, search }, canManage);

  if (!canManage) {
    return (
      <Card padding="none">
        <StateMessage
          icon={ShieldAlert}
          title="No permission"
          description="You don't have access to manage staff."
        />
      </Card>
    );
  }

  const pendingTotal = pending.data?.meta.total ?? 0;

  const tabs: { value: Tab; label: string }[] = [
    { value: "pending", label: pendingTotal > 0 ? `Pending approvals (${pendingTotal})` : "Pending approvals" },
    { value: "active", label: "Active staff" },
  ];

  const loading = (
    <div className="flex justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Team / Access"
        title="Team"
        subtitle="Approve new staff and decide what each person can do."
        aside={
          pendingTotal > 0 ? (
            <Badge tone="accent" dot>
              {pendingTotal} waiting for approval
            </Badge>
          ) : null
        }
      />

      <Card padding="none" className="overflow-hidden">
        {/* Tabs */}
        <div role="tablist" className="grid grid-cols-2 border-b border-line">
          {tabs.map((t) => {
            const selected = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.value)}
                className={`-mb-px border-b-[3px] py-3 text-center text-sm font-semibold transition ${
                  selected ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Pending approvals */}
        {tab === "pending" &&
          (pending.isLoading ? (
            loading
          ) : pending.error ? (
            <StateMessage
              icon={ShieldAlert}
              title="Could not load requests"
              description={pending.error instanceof ApiError ? pending.error.message : undefined}
            />
          ) : pending.data && pending.data.data.length === 0 ? (
            <StateMessage
              icon={UserCheck}
              title="No pending requests"
              description="New staff accounts waiting for approval will appear here."
            />
          ) : (
            <>
              {pending.data?.data.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"
                >
                  <Avatar name={s.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{s.fullName}</p>
                    <p className="truncate text-xs text-muted">{s.email}</p>
                  </div>
                  <span className="hidden font-mono text-xs text-muted sm:block">
                    Requested {formatDate(s.createdAt)}
                  </span>
                  <Button compact variant="accent" onClick={() => setTarget({ mode: "approve", staff: s })}>
                    Review request
                  </Button>
                </div>
              ))}
              {pending.data && (
                <Pagination
                  page={pending.data.meta.page}
                  totalPages={pending.data.meta.totalPages}
                  total={pending.data.meta.total}
                  limit={pending.data.meta.limit}
                  onChange={setPendingPage}
                />
              )}
            </>
          ))}

        {/* Active staff */}
        {tab === "active" && (
          <>
            <div className="border-b border-line px-5 py-3">
              <div className="relative max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setActivePage(1);
                  }}
                  placeholder="Search staff"
                  className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            {active.isLoading ? (
              loading
            ) : active.error ? (
              <StateMessage
                icon={ShieldAlert}
                title="Could not load staff"
                description={active.error instanceof ApiError ? active.error.message : undefined}
              />
            ) : active.data && active.data.data.length === 0 ? (
              <StateMessage
                icon={Users}
                title={search ? "No matching staff" : "No active staff yet"}
                description={search ? "Try a different search." : undefined}
              />
            ) : (
              <>
                {active.data?.data.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"
                  >
                    <Avatar name={s.fullName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {s.fullName}
                        {me?.user.id === s.id && (
                          <span className="ml-2 font-mono text-[10px] font-normal text-muted">you</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted">{s.workEmail}</p>
                    </div>
                    <span className="hidden text-xs text-muted sm:block">
                      {s.permissions?.length ?? 0} permissions
                    </span>
                    <Button compact variant="outline" onClick={() => setTarget({ mode: "edit", staff: s })}>
                      Edit permissions
                    </Button>
                  </div>
                ))}
                {active.data && (
                  <Pagination
                    page={active.data.meta.page}
                    totalPages={active.data.meta.totalPages}
                    total={active.data.meta.total}
                    limit={active.data.meta.limit}
                    onChange={setActivePage}
                  />
                )}
              </>
            )}
          </>
        )}
      </Card>

      {target && (
        <PermissionsDialog
          key={`${target.mode}-${target.staff.id}`}
          mode={target.mode}
          person={{
            id: target.staff.id,
            fullName: target.staff.fullName,
            email: target.mode === "approve" ? target.staff.email : target.staff.workEmail,
          }}
          initialPermissions={target.mode === "edit" ? (target.staff.permissions ?? []) : []}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}