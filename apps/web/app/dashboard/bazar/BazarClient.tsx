"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@workspace/ui/components/button";
import { Lang, t } from "@/lib/lang";
import { getWeekdayKey } from "@/lib/mealBoard";
import { ShoppingCart, Plus, Pencil, Trash2, Wallet } from "lucide-react";

export interface BazarEntryView {
  id: string;
  month: string;
  date: number;
  day: string;
  description: string;
  amount: number;
  createdBy: string;
  createdAt: string;
}

interface BazarClientProps {
  lang: Lang;
  month: string;
  isManager: boolean;
  entries: BazarEntryView[];
}

const cardClass =
  "glass-strong rounded-2xl border border-white/10 p-4 md:p-5 transition-all duration-200";
const fieldClass =
  "glass w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors focus:ring-2 focus:ring-emerald-500 placeholder:text-white/40";
const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60";

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

export function BazarClient({
  lang,
  month,
  isManager,
  entries,
}: BazarClientProps) {
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => i + 1);
  const today = new Date().getDate();
  const initialDay = days.includes(today) ? today : days[0] ?? 1;

  const [date, setDate] = useState<string>(String(initialDay));
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

  const weekdayLabel = (key: string): string => {
    const translated = t(lang, `weekdaysLong.${key}`);
    return translated === `weekdaysLong.${key}` ? key : translated;
  };

  const dateOptionLabel = (day: number): string => {
    const key = getWeekdayKey(day, month);
    const weekday = key ? weekdayLabel(key) : "";
    return weekday ? `${day} — ${weekday}` : String(day);
  };

  function resetForm() {
    setDate(String(initialDay));
    setDescription("");
    setAmount("");
    setEditingId(null);
  }

  async function handleSubmit() {
    const parsedDate = Number.parseInt(date, 10);
    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isInteger(parsedDate) || parsedDate < 1 || parsedDate > days.length) {
      setError(t(lang, "pages.bazar.errorValidation"));
      return;
    }
    if (description.trim().length === 0) {
      setError(t(lang, "pages.bazar.errorValidation"));
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t(lang, "pages.bazar.errorValidation"));
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = editingId ? "/api/bazar" : "/api/bazar";
      const method = editingId ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        month,
        date: parsedDate,
        description: description.trim(),
        amount: parsedAmount,
      };
      if (editingId) body.id = editingId;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setError(
          await readServerError(
            response,
            editingId
              ? t(lang, "pages.bazar.errorNotFound")
              : t(lang, "pages.bazar.errorNotManager")
          )
        );
        return;
      }

      setSuccess(
        editingId
          ? t(lang, "pages.bazar.entryUpdated")
          : t(lang, "pages.bazar.entryAdded")
      );
      resetForm();
      window.location.reload();
    } catch {
      setError(
        editingId
          ? t(lang, "pages.bazar.errorNotFound")
          : t(lang, "pages.bazar.errorNotManager")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/bazar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        setError(
          await readServerError(
            response,
            t(lang, "pages.bazar.errorNotFound")
          )
        );
        return;
      }

      setSuccess(t(lang, "pages.bazar.entryRemoved"));
      window.location.reload();
    } catch {
      setError(t(lang, "pages.bazar.errorNotFound"));
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(entry: BazarEntryView) {
    setEditingId(entry.id);
    setDate(String(entry.date));
    setDescription(entry.description);
    setAmount(String(entry.amount));
    setError("");
    setSuccess("");
  }

  const empty = entries.length === 0;

  return (
    <div className="space-y-6">
      {isManager && (
        <section className={cardClass}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/25 to-orange-700/15 text-orange-300">
              <ShoppingCart className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t(lang, "pages.bazar.addEntry")}
              </h3>
              <p className="text-xs text-white/50">
                {t(lang, "pages.bazar.entryHint")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={labelClass}>
                {t(lang, "pages.bazar.dateLabel")}
              </label>
              <select
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

            <div className="md:col-span-1">
              <label className={labelClass}>
                {t(lang, "pages.bazar.descriptionLabel")}
              </label>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t(lang, "pages.bazar.descriptionLabel")}
                className={fieldClass}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t(lang, "pages.bazar.amountLabel")}
              </label>
              <input
                type="number"
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
              className="glass rounded-xl bg-emerald-500 text-white transition-colors hover:bg-emerald-500/90 disabled:opacity-60"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ...
                </span>
              ) : editingId ? (
                t(lang, "pages.bazar.updateButton")
              ) : (
                t(lang, "pages.bazar.addButton")
              )}
            </Button>
            {editingId && (
              <Button
                variant="ghost"
                className="glass rounded-xl text-white transition-colors hover:bg-white/10"
                onClick={resetForm}
                disabled={isSaving}
              >
                {t(lang, "pages.bazar.cancelButton")}
              </Button>
            )}
          </div>

          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          )}
          {success && (
            <p
              role="status"
              className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
            >
              {success}
            </p>
          )}
        </section>
      )}

      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/15 text-emerald-300">
              <Wallet className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t(lang, "pages.bazar.monthlyTotal")}
              </h3>
              <p className="text-xs text-white/50">
                {entries.length} {t(lang, "pages.bazar.history").toLowerCase()}
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatAmount(total, lang)}
          </p>
        </div>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/15 text-emerald-300">
            <ShoppingCart className="size-4" />
          </div>
          <h3 className="text-base font-semibold text-white">
            {t(lang, "pages.bazar.history")}
          </h3>
        </div>

        {empty ? (
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50">
            {t(lang, "pages.bazar.noEntries")}
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="glass flex items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-white/10"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <span className="text-sm font-bold leading-none">{entry.date}</span>
                    <span className="text-[9px] uppercase tracking-wide">
                      {weekdayLabel(entry.day).slice(0, 3)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {entry.description}
                    </p>
                    <p className="text-xs text-white/60">
                      {entry.date} — {weekdayLabel(entry.day)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <p className="font-semibold text-white">
                    {formatAmount(entry.amount, lang)}
                  </p>
                  {isManager && (
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        onClick={() => handleEdit(entry)}
                        disabled={isSaving || deletingId === entry.id}
                        aria-label={t(lang, "pages.bazar.updateButton")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                        onClick={() => handleDelete(entry.id)}
                        disabled={isSaving || deletingId === entry.id}
                        aria-label={t(lang, "pages.bazar.removeButton")}
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