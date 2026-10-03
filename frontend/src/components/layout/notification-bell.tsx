"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { notificationHref } from "@/lib/notification-text";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import type { AppNotification } from "@/types/notifications";
import { NotificationItem } from "@/components/notifications/notification-item";

const PAGE_SIZE = 15;
const MAX_LIMIT = 100;

// Extra props from older call sites are accepted and ignored
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NotificationBell(_props: { [key: string]: unknown }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Closed: only the unread count is needed, so ask for a single row
  const { data, isLoading, error } = useNotifications(open ? limit : 1);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.data ?? [];
  const hasMore = !!data && data.meta.total > data.data.length && limit < MAX_LIMIT;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setLimit(PAGE_SIZE);
    setOpen(!open);
  };

  const handleSelect = (notification: AppNotification) => {
    setOpen(false);
    if (!notification.readAt) markRead.mutate(notification.id);
    const href = notificationHref(notification);
    if (href) router.push(href);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-canvas"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-3 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-ink">Notifications</h2>
            <span className="font-mono text-[11px] text-muted">
              {unreadCount > 0 ? `${unreadCount} unread` : "Recent updates"}
            </span>
          </div>

          {isLoading && !data ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : error ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              {error instanceof ApiError ? error.message : "Could not load notifications."}
            </p>
          ) : items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-ink">You're all caught up</p>
              <p className="mt-1 text-xs text-muted">New updates will appear here.</p>
            </div>
          ) : (
            <div className="max-h-[min(60vh,26rem)] overflow-y-auto">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={unreadCount === 0 || markAll.isPending}
              className="text-sm font-semibold text-ink underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              Mark all as read
            </button>
            {hasMore && (
              <button
                type="button"
                onClick={() => setLimit((current) => Math.min(MAX_LIMIT, current + PAGE_SIZE))}
                className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
              >
                Show more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;