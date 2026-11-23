"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@workspace/ui/components/button";
import { Lang, t } from "@/lib/lang";
import {
  CalendarDays,
  Landmark,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  StickyNote,
  Trash2,
  Undo2,
  Wallet,
} from "lucide-react";

export interface OfficeLoanRepaymentView {
  id: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface OfficeLoanView {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
  repayments: OfficeLoanRepaymentView[];
  totalRepaid: number;
  remainingBalance: number;
}

interface OfficeLoanSummaryView {
  loanCount: number;
  totalLoaned: number;
  totalRepaid: number;
  remainingBalance: number;
}

interface OfficeLoansClientProps {
  lang: Lang;
  initialLoans: OfficeLoanView[];
  initialSummary: OfficeLoanSummaryView;
  initialError: string;
  defaultDate: string;
}

interface LoanFormState {
  amount: string;
  date: string;
  note: string;
}

const cardClass =
  "glass-strong rounded-2xl border app-border p-4 md:p-5 transition-all duration-200";
const fieldClass =
  "glass w-full min-w-0 rounded-xl px-3 py-2.5 text-sm app-text outline-none transition-colors focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-60 placeholder:app-text-faint";
const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide app-text-muted";
const iconButtonClass =
  "size-8 rounded-lg app-text-muted transition-colors hover:app-surface-strong hover:app-text disabled:opacity-50";

function emptyForm(defaultDate: string): LoanFormState {
  return { amount: "", date: defaultDate, note: "" };
}

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

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatAmount(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function isValidAmount(raw: string): boolean {
  if (raw.trim() === "") return false;
  const value = Number(raw);
  return (
    Number.isFinite(value) && value > 0 && value <= 1_000_000_000
  );
}

function isValidDate(raw: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === raw
  );
}

function isValidNote(raw: string): boolean {
  return raw.trim().length <= 500;
}

function parseLoansPayload(value: unknown): {
  loans: OfficeLoanView[];
  summary: OfficeLoanSummaryView;
} | null {
  if (typeof value !== "object" || value === null) return null;
  const payload = value as { loans?: unknown; summary?: unknown };
  if (!Array.isArray(payload.loans)) return null;
  if (typeof payload.summary !== "object" || payload.summary === null) {
    return null;
  }
  return {
    loans: payload.loans as OfficeLoanView[],
    summary: payload.summary as OfficeLoanSummaryView,
  };
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  tint: "emerald" | "orange" | "amber";
  delay: number;
}

function SummaryCard({ title, value, icon, tint, delay }: SummaryCardProps) {
  const iconClass =
    tint === "orange"
      ? "app-icon-orange"
      : tint === "amber"
        ? "app-icon-amber"
        : "app-icon-emerald";

  return (
    <div
      className={cn(
        "glass rounded-2xl border app-border p-5 hover-lift animate-fade-in-up transition-colors",
        `delay-${delay}`
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", iconClass)}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
          {title}
        </p>
        <p className="mt-1 break-words text-xl font-bold tabular-nums app-text sm:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
}

export function OfficeLoansClient({
  lang,
  initialLoans,
  initialSummary,
  initialError,
  defaultDate,
}: OfficeLoansClientProps) {
  const [loans, setLoans] = useState<OfficeLoanView[]>(initialLoans);
  const [summary, setSummary] = useState<OfficeLoanSummaryView>(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");

  const [loanForm, setLoanForm] = useState<LoanFormState>(emptyForm(defaultDate));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingLoan, setSavingLoan] = useState(false);
  const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null);

  const [repaymentForms, setRepaymentForms] = useState<
    Record<string, LoanFormState>
  >({});
  const [savingRepaymentId, setSavingRepaymentId] = useState<string | null>(null);
  const [deletingRepaymentId, setDeletingRepaymentId] = useState<string | null>(
    null
  );

  const busy =
    savingLoan ||
    savingRepaymentId !== null ||
    deletingLoanId !== null ||
    deletingRepaymentId !== null;

  function getRepaymentForm(loanId: string): LoanFormState {
    return repaymentForms[loanId] ?? emptyForm(defaultDate);
  }

  function updateRepaymentForm(loanId: string, patch: Partial<LoanFormState>) {
    setRepaymentForms((previous) => ({
      ...previous,
      [loanId]: {
        amount: "",
        date: defaultDate,
        note: "",
        ...previous[loanId],
        ...patch,
      },
    }));
  }

  function clearRepaymentForm(loanId: string) {
    setRepaymentForms((previous) => ({
      ...previous,
      [loanId]: emptyForm(defaultDate),
    }));
  }

  function validateForm(form: LoanFormState): string | null {
    if (!isValidAmount(form.amount) || !isValidDate(form.date) || !isValidNote(form.note)) {
      return t(lang, "pages.officeLoans.errorValidation");
    }
    return null;
  }

  function resetLoanForm() {
    setLoanForm(emptyForm(defaultDate));
    setEditingId(null);
  }

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/office-loans", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(
          await readServerError(
            response,
            t(lang, "pages.officeLoans.errorLoad")
          )
        );
      }

      const payload = parseLoansPayload(await response.json());
      if (!payload) {
        throw new Error(t(lang, "pages.officeLoans.errorLoad"));
      }

      setLoans(payload.loans);
      setSummary(payload.summary);
    } catch (caught) {
      setError(
        errorMessage(caught, t(lang, "pages.officeLoans.errorLoad"))
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLoanSubmit() {
    const validationError = validateForm(loanForm);
    if (validationError) {
      setError(validationError);
      setNotice("");
      return;
    }

    setSavingLoan(true);
    setError("");
    setNotice("");

    const isEdit = editingId !== null;
    try {
      const body: Record<string, unknown> = {
        amount: Number(loanForm.amount),
        date: loanForm.date,
        note: loanForm.note.trim(),
      };
      if (isEdit) body.id = editingId;

      const response = await fetch("/api/office-loans", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          await readServerError(
            response,
            t(
              lang,
              isEdit
                ? "pages.officeLoans.errorNotFound"
                : "pages.officeLoans.errorNotManager"
            )
          )
        );
      }

      setNotice(
        t(
          lang,
          isEdit ? "pages.officeLoans.loanUpdated" : "pages.officeLoans.loanAdded"
        )
      );
      resetLoanForm();
      await refresh();
    } catch (caught) {
      setError(
        errorMessage(
          caught,
          t(
            lang,
            isEdit
              ? "pages.officeLoans.errorNotFound"
              : "pages.officeLoans.errorNotManager"
          )
        )
      );
    } finally {
      setSavingLoan(false);
    }
  }

  function handleEditLoan(loan: OfficeLoanView) {
    setEditingId(loan.id);
    setLoanForm({
      amount: String(loan.amount),
      date: loan.date,
      note: loan.note ?? "",
    });
    setError("");
    setNotice("");
    document.getElementById("office-loan-form")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  async function handleDeleteLoan(loan: OfficeLoanView) {
    if (!window.confirm(t(lang, "pages.officeLoans.confirmDeleteLoan"))) {
      return;
    }

    setDeletingLoanId(loan.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/office-loans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: loan.id }),
      });

      if (!response.ok) {
        throw new Error(
          await readServerError(
            response,
            t(lang, "pages.officeLoans.errorNotFound")
          )
        );
      }

      setNotice(t(lang, "pages.officeLoans.loanRemoved"));
      if (editingId === loan.id) resetLoanForm();
      await refresh();
    } catch (caught) {
      setError(
        errorMessage(caught, t(lang, "pages.officeLoans.errorNotFound"))
      );
    } finally {
      setDeletingLoanId(null);
    }
  }

  async function handleRepaymentSubmit(loanId: string) {
    const form = getRepaymentForm(loanId);
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      setNotice("");
      return;
    }

    setSavingRepaymentId(loanId);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/office-loans/repayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId,
          amount: Number(form.amount),
          date: form.date,
          note: form.note.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readServerError(
            response,
            t(lang, "pages.officeLoans.errorValidation")
          )
        );
      }

      clearRepaymentForm(loanId);
      setNotice(t(lang, "pages.officeLoans.repaymentAdded"));
      await refresh();
    } catch (caught) {
      setError(
        errorMessage(caught, t(lang, "pages.officeLoans.errorValidation"))
      );
    } finally {
      setSavingRepaymentId(null);
    }
  }

  async function handleDeleteRepayment(loanId: string, repaymentId: string) {
    if (!window.confirm(t(lang, "pages.officeLoans.confirmDeleteRepayment"))) {
      return;
    }

    setDeletingRepaymentId(repaymentId);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/office-loans/repayments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, repaymentId }),
      });

      if (!response.ok) {
        throw new Error(
          await readServerError(
            response,
            t(lang, "pages.officeLoans.errorNotFound")
          )
        );
      }

      setNotice(t(lang, "pages.officeLoans.repaymentRemoved"));
      await refresh();
    } catch (caught) {
      setError(
        errorMessage(caught, t(lang, "pages.officeLoans.errorNotFound"))
      );
    } finally {
      setDeletingRepaymentId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title={t(lang, "pages.officeLoans.totalLoan")}
          value={formatAmount(summary.totalLoaned, lang)}
          icon={<Landmark className="size-5" />}
          tint="emerald"
          delay={1}
        />
        <SummaryCard
          title={t(lang, "pages.officeLoans.totalRepaid")}
          value={formatAmount(summary.totalRepaid, lang)}
          icon={<Undo2 className="size-5" />}
          tint="amber"
          delay={2}
        />
        <SummaryCard
          title={t(lang, "pages.officeLoans.remainingBalance")}
          value={formatAmount(summary.remainingBalance, lang)}
          icon={<Wallet className="size-5" />}
          tint="orange"
          delay={3}
        />
      </section>

      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm app-text-danger"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm app-text-emerald"
        >
          {notice}
        </p>
      )}

      <section id="office-loan-form" className={cardClass}>
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-icon-emerald">
            {editingId ? (
              <Pencil className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold app-text">
              {t(
                lang,
                editingId
                  ? "pages.officeLoans.updateButton"
                  : "pages.officeLoans.addLoan"
              )}
            </h3>
            <p className="text-xs app-text-faint">
              {t(lang, "pages.officeLoans.loanHint")}
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleLoanSubmit();
          }}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="office-loan-amount" className={labelClass}>
                {t(lang, "pages.officeLoans.amountLabel")}
              </label>
              <input
                id="office-loan-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                max="1000000000"
                value={loanForm.amount}
                onChange={(event) =>
                  setLoanForm((previous) => ({
                    ...previous,
                    amount: event.target.value,
                  }))
                }
                className={fieldClass}
                placeholder="0"
                disabled={busy}
              />
            </div>

            <div>
              <label htmlFor="office-loan-date" className={labelClass}>
                {t(lang, "pages.officeLoans.dateLabel")}
              </label>
              <input
                id="office-loan-date"
                type="date"
                value={loanForm.date}
                onChange={(event) =>
                  setLoanForm((previous) => ({
                    ...previous,
                    date: event.target.value,
                  }))
                }
                className={fieldClass}
                disabled={busy}
              />
            </div>

            <div>
              <label htmlFor="office-loan-note" className={labelClass}>
                {t(lang, "pages.officeLoans.noteLabel")}
              </label>
              <input
                id="office-loan-note"
                type="text"
                maxLength={500}
                value={loanForm.note}
                onChange={(event) =>
                  setLoanForm((previous) => ({
                    ...previous,
                    note: event.target.value,
                  }))
                }
                className={fieldClass}
                placeholder="—"
                disabled={busy}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="submit"
              className="app-primary-button rounded-xl disabled:opacity-60"
              disabled={busy}
            >
              {savingLoan ? (
                <span className="flex items-center gap-2">
                  <span className="app-spinner" aria-hidden="true" />
                  ...
                </span>
              ) : editingId ? (
                t(lang, "pages.officeLoans.updateButton")
              ) : (
                t(lang, "pages.officeLoans.addLoan")
              )}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                className="glass rounded-xl app-text transition-colors hover:app-surface-strong"
                onClick={resetLoanForm}
                disabled={busy}
              >
                {t(lang, "pages.officeLoans.cancelButton")}
              </Button>
            )}
          </div>
        </form>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-icon-emerald">
              <Receipt className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold app-text">
                {t(lang, "pages.officeLoans.history")}
              </h3>
              <p className="text-xs app-text-faint">
                {t(lang, "pages.officeLoans.loanCount").replace(
                  "{count}",
                  String(loans.length)
                )}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="glass rounded-xl app-text transition-colors hover:app-surface-strong"
            onClick={() => void refresh()}
            disabled={loading || busy}
          >
            {loading ? (
              <span className="app-spinner" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            <span>{t(lang, "pages.officeLoans.refresh")}</span>
          </Button>
        </div>

        {loading && (
          <p
            role="status"
            className="mb-3 flex items-center gap-2 rounded-lg border app-border app-surface px-3 py-2 text-xs app-text-muted"
          >
            <span className="app-spinner" aria-hidden="true" />
            {t(lang, "pages.officeLoans.loading")}
          </p>
        )}

        {loans.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border app-border app-surface px-4 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl app-icon-emerald">
              <Receipt className="size-5" />
            </div>
            <p className="text-sm font-medium app-text">
              {t(lang, "pages.officeLoans.noLoans")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => {
              const totalRepaid = loan.totalRepaid ?? 0;
              const remaining =
                loan.remainingBalance ?? Math.max(loan.amount - totalRepaid, 0);
              const percent =
                loan.amount > 0
                  ? Math.min(100, Math.max(0, (totalRepaid / loan.amount) * 100))
                  : 0;
              const repayments = loan.repayments ?? [];
              const repaymentForm = getRepaymentForm(loan.id);

              return (
                <article
                  key={loan.id}
                  className="glass rounded-xl border app-border p-3 transition-colors hover:app-surface-strong md:p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl app-icon-emerald">
                        <CalendarDays className="size-3.5" />
                        <span className="text-[10px] font-semibold tabular-nums">
                          {loan.date.slice(5)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold tabular-nums app-text">
                          {formatAmount(loan.amount, lang)}
                        </p>
                        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs app-text-muted">
                          <StickyNote className="size-3 shrink-0" />
                          <span className="truncate">
                            {loan.date}
                            {loan.note ? ` • ${loan.note}` : ""}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wide app-text-faint">
                          {t(lang, "pages.officeLoans.remainingLabel")}
                        </p>
                        <p
                          className={cn(
                            "font-semibold tabular-nums",
                            remaining > 0 ? "app-text-emerald" : "app-text-muted"
                          )}
                        >
                          {formatAmount(remaining, lang)}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={iconButtonClass}
                          onClick={() => handleEditLoan(loan)}
                          disabled={busy}
                          aria-label={t(lang, "pages.officeLoans.updateButton")}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg app-text-danger transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
                          onClick={() => void handleDeleteLoan(loan)}
                          disabled={busy}
                          aria-label={t(lang, "pages.officeLoans.removeButton")}
                        >
                          {deletingLoanId === loan.id ? (
                            <span className="app-spinner" aria-hidden="true" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs app-text-muted">
                      <span>
                        {t(lang, "pages.officeLoans.repaidLabel")}{" "}
                        <span className="font-medium app-text">
                          {formatAmount(totalRepaid, lang)}
                        </span>
                      </span>
                      <span className="tabular-nums">{Math.round(percent)}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full app-inset">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleRepaymentSubmit(loan.id);
                      }}
                      className="rounded-xl border app-border app-surface p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg app-icon-emerald">
                          <Plus className="size-3.5" />
                        </div>
                        <h4 className="text-sm font-semibold app-text">
                          {t(lang, "pages.officeLoans.recordRepayment")}
                        </h4>
                      </div>
                      <p className="mb-2 text-[11px] app-text-faint">
                        {t(lang, "pages.officeLoans.repaymentHint")}
                      </p>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          max="1000000000"
                          aria-label={t(lang, "pages.officeLoans.amountLabel")}
                          value={repaymentForm.amount}
                          onChange={(event) =>
                            updateRepaymentForm(loan.id, {
                              amount: event.target.value,
                            })
                          }
                          className={fieldClass}
                          placeholder="0"
                          disabled={busy}
                        />
                        <input
                          type="date"
                          aria-label={t(lang, "pages.officeLoans.dateLabel")}
                          value={repaymentForm.date}
                          onChange={(event) =>
                            updateRepaymentForm(loan.id, {
                              date: event.target.value,
                            })
                          }
                          className={fieldClass}
                          disabled={busy}
                        />
                        <input
                          type="text"
                          maxLength={500}
                          aria-label={t(lang, "pages.officeLoans.noteLabel")}
                          value={repaymentForm.note}
                          onChange={(event) =>
                            updateRepaymentForm(loan.id, {
                              note: event.target.value,
                            })
                          }
                          className={fieldClass}
                          placeholder="—"
                          disabled={busy}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="app-primary-button mt-3 w-full rounded-xl disabled:opacity-60"
                        disabled={busy}
                      >
                        {savingRepaymentId === loan.id ? (
                          <span className="flex items-center gap-2">
                            <span className="app-spinner" aria-hidden="true" />
                            ...
                          </span>
                        ) : (
                          t(lang, "pages.officeLoans.recordRepayment")
                        )}
                      </Button>
                    </form>

                    <div className="rounded-xl border app-border app-surface p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg app-icon-orange">
                          <Receipt className="size-3.5" />
                        </div>
                        <h4 className="text-sm font-semibold app-text">
                          {t(lang, "pages.officeLoans.repaymentHistory")} (
                          {repayments.length})
                        </h4>
                      </div>

                      {repayments.length === 0 ? (
                        <p className="rounded-lg border app-border app-surface-subtle px-3 py-4 text-center text-xs app-text-faint">
                          {t(lang, "pages.officeLoans.noRepayments")}
                        </p>
                      ) : (
                        <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                          {repayments.map((repayment) => (
                            <li
                              key={repayment.id}
                              className="flex items-center justify-between gap-2 rounded-lg border app-border app-surface-subtle px-2.5 py-2"
                            >
                              <div className="min-w-0" title={repayment.createdAt}>
                                <p className="truncate text-sm font-medium tabular-nums app-text">
                                  {formatAmount(repayment.amount, lang)}
                                </p>
                                <p className="truncate text-[11px] app-text-muted">
                                  {repayment.date}
                                  {repayment.note ? ` • ${repayment.note}` : ""}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-lg app-text-danger transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
                                onClick={() =>
                                  void handleDeleteRepayment(
                                    loan.id,
                                    repayment.id
                                  )
                                }
                                disabled={busy}
                                aria-label={t(
                                  lang,
                                  "pages.officeLoans.removeRepayment"
                                )}
                              >
                                {deletingRepaymentId === repayment.id ? (
                                  <span className="app-spinner" aria-hidden="true" />
                                ) : (
                                  <Trash2 className="size-3.5" />
                                )}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
