"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@workspace/ui/components/button";
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

export function AdvanceClient({
  lang,
  month,
  isManager,
  currentMemberId,
  members,
  entries,
}: AdvanceClientProps) {
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => i + 1);
  const today = new Date().getDate();
  const initialDay = days.includes(today) ? today : days[0] ?? 1;

  const [memberId, setMemberId] = useState<string>(
    isManager ? (members[0]?.id ?? "") : currentMemberId
  );
  const [date, setDate] = useState<string>(String(initialDay));
  const [amount, setAmount] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  function resetForm() {
    setMemberId(isManager ? (members[0]?.id ?? "") : currentMemberId);
    setDate(String(initialDay));
    setAmount("");
    setEditingId(null);
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
    setSuccess("");

    try {
      const url = "/api/advances";
      const method = editingId ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        memberId,
        month,
        date: parsedDate,
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
              ? t(lang, "pages.advance.errorNotFound")
              : t(lang, "pages.advance.errorNotManager")
          )
        );
        return;
      }

      setSuccess(
        editingId
          ? t(lang, "pages.advance.entryUpdated")
          : t(lang, "pages.advance.entryAdded")
      );
      resetForm();
      window.location.reload();
    } catch {
      setError(
        editingId
          ? t(lang, "pages.advance.errorNotFound")
          : t(lang, "pages.advance.errorNotManager")
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
      const response = await fetch("/api/advances", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        setError(
          await readServerError(
            response,
            t(lang, "pages.advance.errorNotFound")
          )
        );
        return;
      }

      setSuccess(t(lang, "pages.advance.entryRemoved"));
      window.location.reload();
    } catch {
      setError(t(lang, "pages.advance.errorNotFound"));
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
    setSuccess("");
  }

  const empty = entries.length === 0;

  return (
    <div className="space-y-6">
      {isManager && (
        <section className={cardClass}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/15 text-emerald-300">
              <Wallet className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t(lang, "pages.advance.addEntry")}
              </h3>
              <p className="text-xs text-white/50">
                {t(lang, "pages.advance.entryHint")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={labelClass}>
                {t(lang, "pages.advance.memberLabel")}
              </label>
              <select
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                className={fieldClass}
                disabled={isSaving}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                {t(lang, "pages.advance.dateLabel")}
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

            <div>
              <label className={labelClass}>
                {t(lang, "pages.advance.amountLabel")}
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
                t(lang, "pages.advance.updateButton")
              ) : (
                t(lang, "pages.advance.addButton")
              )}
            </Button>
            {editingId && (
              <Button
                variant="ghost"
                className="glass rounded-xl text-white transition-colors hover:bg-white/10"
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
                {t(lang, "pages.advance.monthlyTotal")}
              </h3>
              <p className="text-xs text-white/50">
                {entries.length} {t(lang, "pages.advance.history").toLowerCase()}
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatAmount(total, lang)}
          </p>
        </div>

        {isManager && memberTotals.length > 0 && (
          <div className="mb-4 space-y-1.5 border-t border-white/10 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-white/50">
              {t(lang, "pages.advance.memberTotals")}
            </p>
            {memberTotals.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 text-sm"
              >
                <span className="text-white/80">{member.name}</span>
                <span className="font-medium text-white">
                  {formatAmount(member.total, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/15 text-emerald-300">
            <User className="size-4" />
          </div>
          <h3 className="text-base font-semibold text-white">
            {t(lang, "pages.advance.history")}
          </h3>
        </div>

        {empty ? (
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50">
            {t(lang, "pages.advance.noEntries")}
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
                      {weekdayLabel(entry.date).slice(0, 3)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {entry.memberName}
                    </p>
                    <p className="text-xs text-white/60">
                      {entry.date} — {weekdayLabel(entry.date)}
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
                        aria-label={t(lang, "pages.advance.updateButton")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
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