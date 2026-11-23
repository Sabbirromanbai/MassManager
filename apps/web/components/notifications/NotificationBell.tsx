"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "cn";
import { Button } from "@workspace/ui/components/button";
import { Bell, Check, CheckCheck, Inbox, X } from "lucide-react";
import { Lang, t } from "@/lib/lang";
import type { SerializedNotification } from "@/lib/notifications";

interface NotificationBellProps {
  lang: Lang;
  variant?: "header" | "mobile";
}

async function readServerError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "error" in data) {
      const message = (data as { error?: unknown }).error;
      if (typeof message === "string" && message.length > 0) return message;
    }
  } catch {
    // Use the translated fallback.
  }
  return fallback;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatTime(value: string, lang: Lang): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(parsed);
}

export function NotificationBell({
  lang,
  variant = "header",
}: NotificationBellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<SerializedNotification[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(
          await readServerError(response, t(lang, "notifications.error"))
        );
      }
      const data: unknown = await response.json();
      const count =
        typeof data === "object" && data !== null && "unreadCount" in data
          ? (data as { unreadCount?: unknown }).unreadCount
          : 0;
      setUnreadCount(typeof count === "number" ? count : 0);
    } catch {
      // The badge is non-critical; the panel still loads on demand.
    }
  }, [lang]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(
          await readServerError(response, t(lang, "notifications.error"))
        );
      }

      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null) {
        throw new Error(t(lang, "notifications.error"));
      }
      const payload = data as { notifications?: unknown; unreadCount?: unknown };
      if (!Array.isArray(payload.notifications)) {
        throw new Error(t(lang, "notifications.error"));
      }

      setNotifications(payload.notifications as SerializedNotification[]);
      setUnreadCount(
        typeof payload.unreadCount === "number" ? payload.unreadCount : 0
      );
    } catch (caught) {
      setError(errorMessage(caught, t(lang, "notifications.error")));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  // The mobile bell lives in the persistent layout, so it must refresh the
  // badge on navigation instead of only when it first mounts.
  useEffect(() => {
    void loadCount();
  }, [loadCount, pathname]);

  useEffect(() => {
    if (open) void loadNotifications();
  }, [open, loadNotifications]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function markOne(id: string, wasUnread: boolean) {
    setMarkingId(id);
    try {
      const response = await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error(
          await readServerError(response, t(lang, "notifications.markFailed"))
        );
      }
      const now = new Date().toISOString();
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? { ...notification, readAt: notification.readAt ?? now }
            : notification
        )
      );
      if (wasUnread) setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (caught) {
      setError(errorMessage(caught, t(lang, "notifications.markFailed")));
    } finally {
      setMarkingId(null);
    }
  }

  async function handleNotificationClick(notification: SerializedNotification) {
    await markOne(notification.id, !notification.readAt);
    setOpen(false);
    router.push(notification.link ?? "/dashboard/meal-board");
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    setError("");
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error(
          await readServerError(response, t(lang, "notifications.markAllFailed"))
        );
      }
      const now = new Date().toISOString();
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? now,
        }))
      );
      setUnreadCount(0);
    } catch (caught) {
      setError(errorMessage(caught, t(lang, "notifications.markAllFailed")));
    } finally {
      setMarkingAll(false);
    }
  }

  const bellClass =
    variant === "mobile"
      ? "h-9 w-9 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20"
      : "h-9 w-9 rounded-full app-surface-strong app-border app-text hover:app-surface-hover";

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative", bellClass)}
        aria-label={t(lang, "notifications.bellLabel")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((previous) => !previous)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold leading-4 text-white shadow-[0_0_8px_rgba(16,185,129,0.6)]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label={t(lang, "notifications.title")}
          className="glass-strong absolute right-0 top-full z-50 mt-2 flex max-h-[min(70vh,32rem)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border app-border shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 border-b app-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Bell className="size-4 shrink-0 app-text-emerald" />
              <h3 className="truncate text-sm font-semibold app-text">
                {t(lang, "notifications.title")}
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold app-text-emerald">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg app-text-muted transition-colors hover:app-surface-strong hover:app-text disabled:opacity-50"
                  onClick={() => void handleMarkAll()}
                  disabled={markingAll}
                  aria-label={t(lang, "notifications.markAllRead")}
                  title={t(lang, "notifications.markAllRead")}
                >
                  {markingAll ? (
                    <span className="app-spinner" aria-hidden="true" />
                  ) : (
                    <CheckCheck className="size-4" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg app-text-muted transition-colors hover:app-surface-strong hover:app-text"
                onClick={() => setOpen(false)}
                aria-label={t(lang, "notifications.close")}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2">
              <p role="alert" aria-live="assertive" className="text-xs app-text-danger">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadNotifications()}
                className="mt-1 text-xs font-semibold app-text-emerald hover:underline"
              >
                {t(lang, "notifications.retry")}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm app-text-muted">
              <span className="app-spinner" aria-hidden="true" />
              {t(lang, "notifications.loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <div className="flex size-11 items-center justify-center rounded-xl app-icon-emerald">
                <Inbox className="size-5" />
              </div>
              <p className="text-sm font-medium app-text">
                {t(lang, "notifications.empty")}
              </p>
            </div>
          ) : (
            <ul className="overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b app-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => void handleNotificationClick(notification)}
                    disabled={markingId === notification.id}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:app-surface-strong disabled:opacity-60",
                      !notification.readAt && "bg-emerald-500/5"
                    )}
                  >
                    <span className="mt-1.5 flex w-2 shrink-0 justify-center">
                      {notification.readAt ? (
                        <Check className="size-3 app-text-faint" />
                      ) : (
                        <span className="size-2 rounded-full bg-emerald-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-semibold app-text">
                          {notification.title}
                        </span>
                        <span className="shrink-0 text-[10px] app-text-faint">
                          {formatTime(notification.createdAt, lang)}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed app-text-muted">
                        {notification.message}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
