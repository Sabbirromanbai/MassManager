"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@workspace/ui/components/button";
import { useToast } from "@workspace/ui/components/toast";
import { Lang, t } from "@/lib/lang";
import { getWeekdayKey } from "@/lib/mealBoard";
import { Wallet, Plus, Pencil, Trash2, User } from "lucide-react";

export interface AdvanceEntryView {
  id: string;
  memberId: string;
  memberName: string;
  month: string;
  date: number;
  amount: number;
  receivedBy: string;
  createdAt: string;
}

interface MemberOption {
  id: string;
  name: string;
}

interface AdvanceClientProps {
  lang: Lang;
  month: string;
  isManager: boolean;
  currentMemberId: string;
  members: MemberOption[];
  entries: AdvanceEntryView[];
}

const cardClass =
  "glass-strong rounded-2xl border app-border p-4 md:p-5 transition-all duration-200";
const fieldClass =
  "glass w-full min-w-0 rounded-xl px-3 py-2.5 text-sm app-text outline-none transition-colors focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-60 placeholder:app-text-faint";
const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide app-text-muted";

async function readServerError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "error" in data) {
      const message = (data as { error?: unknown }).error;
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
    }
  } catch {
    // fall back below
  }
  return fallback;
}

function formatAmount(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function daysInMonth(month: string): number {
  const parts = month.split("-");
  const year = Number(parts[0]);
  const monthNum = Number(parts[1]);
  if (!Number.isInteger(year) || !Number.isInteger(monthNum)) return 30;
  return new Date(year, monthNum, 0).getDate();
}

export function AdvanceClient({
  lang,
  month,
  isManager,
  currentMemberId,
  members,
  entries: initialEntries,
}: AdvanceClientProps) {
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => i + 1);
  const today = new Date().getDate();
  const initialDay = days.includes(today) ? today : days[0] ?? 1;

  const { toast } = useToast();

  const [entriesState, setEntriesState] = useState<AdvanceEntryView[]>(
    initialEntries
  );

  const [memberId, setMemberId] = useState<string>(
    isManager ? (members[0]?.id ?? "") : currentMemberId
  );
  const [date, setDate] = useState<string>(String(initialDay));
  const [amount, setAmount] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const entries = entriesState;
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

  const memberTotals = members
    .map((member) => ({
      id: member.id,
      name: member.name,
      total: entries
        .filter((entry) => entry.memberId === member.id)
        .reduce((sum, entry) => sum + entry.amount, 0),
    }))
    .filter((m) => m.total > 0);

  const weekdayLabel = (day: number): string => {
    const key = getWeekdayKey(day, month);
    if (!key) return "";
    const translated = t(lang, `weekdaysLong.${key}`);
    return translated === `weekdaysLong.${key}` ? key : translated;
  };

  const dateOptionLabel = (day: number): string => {
    const weekday = weekdayLabel(day);
    return weekday ? `${day} — ${weekday}` : String(day);
  };

  async function refreshEntries() {
    try {
      const response = await fetch(
        `/api/advances?month=${encodeURIComponent(month)}`,
        {
          cache: "no-store",
        }
      );
      if (!response.ok) {
        throw new Error(
          await readServerError(response, t(lang, "pages.advance.errorLoad"))
        );
      }
      const data: unknown = await response.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "entries" in data &&
        Array.isArray((data as { entries?: unknown }).entries)
      ) {
        setEntriesState((data as { entries: AdvanceEntryView[] }).entries);
      }
    } catch {
      // Keep the existing entries if refresh fails; the toast already confirmed the mutation.
    }
  }

  function resetForm() {
    setMemberId(isManager ? (members[0]?.id ?? "") : currentMemberId);
    setDate(String(initialDay));
    setAmount("");
    setEditingId(null);
    setError("");
  }

  async function handleSubmit() {
    const parsedDate = Number.parseInt(date, 10);
    const parsedAmount = Number.parseFloat(amount);

    if (!memberId) {
      setError(t(lang, "pages.advance.errorValidation"));
      return;
    }
    if (!Number.isInteger(parsedDate) || parsedDate < 1 || parsedDate > days.length) {
      setError(t(lang, "pages.advance.errorValidation"));
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t(lang, "pages.advance.errorValidation"));
      return;
    }

    setIsSaving(true);
    setError("");

    const isEdit = editingId !== null;
    try {
      const url = "/api/advances";
      const method = isEdit ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        memberId,
        month,
        date: parsedDate,
        amount: parsedAmount,
      };
      if (isEdit) body.id = editingId;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          await readServerError(
            response,
            isEdit
              ? t(lang, "pages.advance.errorNotFound")
              : t(lang, "pages.advance.errorNotManager")
          )
        );
      }

      toast({
        title: t(lang, isEdit ? "pages.advance.entryUpdated" : "pages.advance.entryAdded"),
        variant: "success",
        description: t(lang, "pages.advance.toastDescription"),
      });
      await refreshEntries();
      resetForm();
    } catch (caught) {
      toast({
        title: t(lang, "pages.advance.errorOperation"),
        variant: "error",
        description:
          caught instanceof Error && caught.message
            ? caught.message
            : t(lang, "pages.advance.errorNotManager"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const response = await fetch("/api/advances", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(
          await readServerError(response, t(lang, "pages.advance.errorNotFound"))
        );
      }

      toast({
        title: t(lang, "pages.advance.entryRemoved"),
        variant: "success",
        description: t(lang, "pages.advance.toastDescription"),
      });
      await refreshEntries();
    } catch (caught) {
      toast({
        title: t(lang, "pages.advance.errorOperation"),
        variant: "error",
        description:
          caught instanceof Error && caught.message
            ? caught.message
            : t(lang, "pages.advance.errorNotFound"),
      });
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(entry: AdvanceEntryView) {
    setEditingId(entry.id);
    setMemberId(entry.memberId);
    setDate(String(entry.date));
    setAmount(String(entry.amount));
    setError("");
  }

  const empty = entries.length === 0;

  return (
    <div className="space-y-6">
      {isManager && (
        <section className={cardClass}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-icon-emerald">
              <Wallet className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold app-text">
                {t(lang, "pages.advance.addEntry")}
              </h3>
              <p className="text-xs app-text-faint">
                {t(lang, "pages.advance.entryHint")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="advance-member" className={labelClass}>
                {t(lang, "pages.advance.memberLabel")}
              </label>
              <select
                id="advance-member"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                className={fieldClass}
                disabled={isSaving}
              >
                <option value="" disabled>
                  {t(lang, "pages.advance.memberLabel")}
                </option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="advance-date" className={labelClass}>
                {t(lang, "pages.advance.dateLabel")}
              </label>
              <select
                id="advance-date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={fieldClass}
                disabled={isSaving}
              >
                {days.map((day) => (
                  <option key={day} value={String(day)}>
                    {dateOptionLabel(day)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="advance-amount" className={labelClass}>
                {t(lang, "pages.advance.amountLabel")}
              </label>
              <input
                id="advance-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                className={fieldClass}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              className="app-primary-button rounded-xl disabled:opacity-60"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="app-spinner" aria-hidden="true" />
                  ...
                </span>
              ) : editingId ? (
                t(lang, "pages.advance.updateButton")
              ) : (
                t(lang, "pages.advance.addButton")
              )}
            </Button>
            {editingId && (
              <Button
                variant="ghost"
                className="glass rounded-xl app-text transition-colors hover:app-surface-strong"
                onClick={resetForm}
                disabled={isSaving}
              >
                {t(lang, "pages.advance.cancelButton")}
              </Button>
            )}
          </div>

          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm app-text-danger"
            >
              {error}
            </p>
          )}
        </section>
      )}

      <section className={cardClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-icon-emerald">
              <Wallet className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold app-text">
                {t(lang, "pages.advance.monthlyTotal")}
              </h3>
              <p className="text-xs app-text-faint">
                {entries.length} {t(lang, "pages.advance.history").toLowerCase()}
              </p>
            </div>
          </div>
          <p className="shrink-0 text-lg font-bold tabular-nums app-text sm:text-2xl">
            {formatAmount(total, lang)}
          </p>
        </div>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-icon-emerald">
            <User className="size-4" />
          </div>
          <h3 className="text-base font-semibold app-text">
            {t(lang, "pages.advance.history")}
          </h3>
        </div>

        {empty ? (
          <p className="rounded-lg border app-border app-surface px-3 py-2 text-sm app-text-faint">
            {t(lang, "pages.advance.noEntries")}
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="glass flex flex-col gap-2 rounded-xl p-3 transition-colors hover:app-surface-strong sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl app-tint-emerald app-text-emerald">
                    <span className="text-sm font-bold leading-none">{entry.date}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium app-text">
                      {entry.memberName}
                    </p>
                    <p className="truncate text-xs app-text-muted">
                      {entry.date} — {weekdayLabel(entry.date)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <p className="font-semibold tabular-nums app-text">
                    {formatAmount(entry.amount, lang)}
                  </p>
                  {isManager && (
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg app-text-muted transition-colors hover:app-surface-strong hover:app-text"
                        onClick={() => handleEdit(entry)}
                        disabled={isSaving || deletingId === entry.id}
                        aria-label={t(lang, "pages.advance.updateButton")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg app-text-danger transition-colors hover:bg-red-500/10 hover:text-red-200"
                        onClick={() => handleDelete(entry.id)}
                        disabled={isSaving || deletingId === entry.id}
                        aria-label={t(lang, "pages.advance.removeButton")}
                      >
                        {deletingId === entry.id ? (
                          <span className="size-4 animate-spin rounded-full border-2 border-red-300/30 border-t-red-300" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
