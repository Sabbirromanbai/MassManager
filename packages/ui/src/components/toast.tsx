"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";

import { Check, Info, Triangle, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (options: Omit<Toast, "id">) => string;
  dismiss: (id?: string) => void;
}

const TOAST_LIMIT = 6;
const DEDUPE_WINDOW_MS = 2000;
const DEFAULT_DURATION_MS = 5000;

const VARIANT_ICON: Record<ToastVariant, React.ReactElement> = {
  success: <Check className="size-4" />,
  error: <X className="size-4" />,
  warning: <Triangle className="size-4" />,
  info: <Info className="size-4" />,
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "app-tint-emerald border border-emerald-500/40 app-text-emerald",
  error: "app-tint-danger border border-red-500/40 app-text-danger",
  warning: "app-tint-warning border border-amber-500/40 app-text-warning",
  info: "app-tint-emerald border border-emerald-500/40 app-text",
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastDedupe = useRef<{ key: string; time: number } | null>(null);

  const dismiss = React.useCallback((id?: string) => {
    setToasts((previous) =>
      id ? previous.filter((toast) => toast.id !== id) : []
    );
  }, []);

  const toast = React.useCallback(
    (options: Omit<Toast, "id">) => {
      const key = `${options.variant}:${options.title}`;
      const now = Date.now();

      // Suppress duplicate/noisy toasts of the same type and title within the
      // dedupe window (for example, rapid repeated submits).
      if (
        lastDedupe.current &&
        lastDedupe.current.key === key &&
        now - lastDedupe.current.time < DEDUPE_WINDOW_MS
      ) {
        return "";
      }
      lastDedupe.current = { key, time: now };

      const id = generateId();
      const toastEntry: Toast = {
        ...options,
        id,
        duration: options.duration ?? DEFAULT_DURATION_MS,
      };
      setToasts((previous) => [toastEntry, ...previous].slice(0, TOAST_LIMIT));
      return id;
    },
    []
  );

  const value = useMemo(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id?: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!mounted || toasts.length === 0) {
    return null;
  }

  // Desktop (top-right): newest toast appears at the top edge.
  // Mobile (bottom-center): newest toast appears at the bottom edge.
  const containerClass = cn(
    "fixed z-[60] p-4 pointer-events-none",
    mobile
      ? "bottom-4 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center gap-2"
      : "top-4 right-4 flex flex-col items-end gap-2"
  );

  return (
    <div className={containerClass} role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [entering, setEntering] = useState(false);
  const variantClass = VARIANT_CLASSES[toast.variant];
  const icon = VARIANT_ICON[toast.variant];

  useEffect(() => {
    setEntering(true);
  }, []);

  // Each toast owns its timer so a newly added toast cannot restart the
  // countdown of the ones already on screen.
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const classes = cn(
    "pointer-events-auto flex items-center gap-3 rounded-xl border p-3 text-sm shadow-lg",
    "transition-all duration-300",
    variantClass,
    entering ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  );

  return (
    <div
      className={classes}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-relaxed opacity-90">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 text-current/70 transition-colors hover:text-current rounded-lg"
        aria-label="Dismiss toast"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
