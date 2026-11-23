"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Lang, t } from "@/lib/lang";
import type { MemberSettlement } from "@/lib/stats";
import type { SerializedOfficeLoan } from "@/lib/officeLoans";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import {
  UtensilsCrossed,
  Scale,
  Receipt,
  Wallet,
  TrendingUp,
  Printer,
} from "lucide-react";

interface MemberReportClientProps {
  lang: Lang;
  month: string;
  isManager: boolean;
  currentMemberId: string;
  members: MemberSettlement[];
}

export interface MemberReportLoanSummary {
  loanCount: number;
  totalLoaned: number;
  totalRepaid: number;
  remainingBalance: number;
}

interface MemberReportData {
  memberName: string;
  memberType: MemberSettlement["memberType"];
  month: string;
  meals: number;
  averageRate: number | null;
  mealCost: number;
  advance: number;
  due: number;
  eggPieces: number;
  eggCost: number;
  guestMeals: number;
  guestCost: number;
  loanSummary: MemberReportLoanSummary | null;
}

type StatTone = "emerald" | "orange" | "danger" | "faint";

const TONE_COLORS: Record<StatTone, string> = {
  emerald: "#047857",
  orange: "#b45309",
  danger: "#b91c1c",
  faint: "#9ca3af",
};

const TONE_TINTS: Record<StatTone, string> = {
  emerald: "#d1fae5",
  orange: "#fef3c7",
  danger: "#fee2e2",
  faint: "#f3f4f6",
};

function formatAmount(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Keep balances free of floating-point noise (mirrors the shared office loan helper). */
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumRepayments(loan: SerializedOfficeLoan): number {
  return roundMoney(
    loan.repayments.reduce((sum, repayment) => sum + repayment.amount, 0)
  );
}

function zeroOrAmount(value: number, lang: Lang): string {
  return value > 0 ? formatAmount(value, lang) : "—";
}

function badgeLabel(lang: Lang, type: MemberSettlement["memberType"]): string {
  return t(lang, `badges.${type}`);
}

const MEMBER_REPORT_PRINT_CSS = `
@page { size: A4; margin: 0; }

@media print {
  html, body { margin: 0; padding: 0; background: #fff !important; }
  /* The dashboard main has responsive padding; with @page margin 0 it would
     push a 210mm sheet off the right edge and add a blank trailing page. */
  main { margin: 0 !important; padding: 0 !important; }
  aside, nav, header, button, select { display: none !important; }
  .member-report-toolbar { display: none !important; }
  main > .pointer-events-none { display: none !important; }
  /* The base .mr-sheet rule below declares width: 100% later in this sheet. */
  .mr-sheet { width: 210mm !important; }
  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}

.mr-sheet {
  width: 100%;
  background: #fff;
  color: #111827;
  border-radius: 18px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.08);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}

.mr-header {
  display: flex;
  flex-direction: column;
  padding: 36px 42px 24px;
  background: linear-gradient(135deg, #064e3b 0%, #134e3f 55%, #1f7a5a 100%);
  color: #fff;
}

.mr-header-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.mr-header-mark {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mr-header-mark img { width: 26px; height: 26px; display: block; }

.mr-header-brand-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(to right, #fff, #d1fae5);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.mr-header-kicker {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
}

.mr-header-title {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.15;
  margin: 8px 0 4px;
  color: #fff;
}

.mr-header-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.mr-header-role {
  align-self: flex-start;
  margin-top: 12px;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-size: 12px;
  font-weight: 600;
}

.mr-body {
  padding: 22px 30px 30px;
}

.mr-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.mr-stat {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 15px 17px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.mr-stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  margin-bottom: 11px;
}

.mr-stat-icon svg { width: 16px; height: 16px; }

.mr-stat-value { font-size: 21px; font-weight: 700; color: #111827; }
.mr-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6b7280;
  margin-top: 3px;
}

.mr-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.mr-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 17px 18px;
}

.mr-section-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;
  margin-bottom: 12px;
}

.mr-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.mr-row:last-child { border-bottom: none; }
.mr-row-label { color: #6b7280; min-width: 0; }
.mr-row-value { font-weight: 700; text-align: right; white-space: nowrap; }
.mr-row-value--danger { color: #b91c1c; }
.mr-row-value--emerald { color: #047857; }
.mr-row-value--faint { color: #9ca3af; }

.mr-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 14px 30px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 12px;
  color: #6b7280;
}
`;

export function MemberReportClient({
  lang,
  month,
  isManager,
  currentMemberId,
  members,
}: MemberReportClientProps) {
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (!isManager) return currentMemberId;
    const own = members.find((m) => m.memberId === currentMemberId);
    return own?.memberId ?? members[0]?.memberId ?? "";
  });

  useEffect(() => {
    // Changing the month re-fetches the settlement and can flip isManager;
    // make sure the selected member is still one this page is allowed to show.
    setSelectedId((current) => {
      if (!isManager) return currentMemberId;
      if (members.some((member) => member.memberId === current)) return current;
      return (
        members.find((member) => member.memberId === currentMemberId)
          ?.memberId ??
        members[0]?.memberId ??
        ""
      );
    });
  }, [isManager, currentMemberId, members]);

  const [officeLoans, setOfficeLoans] = useState<SerializedOfficeLoan[]>([]);
  const [loansLoaded, setLoansLoaded] = useState(false);

  useEffect(() => {
    setLoansLoaded(false);
    if (!isManager) return;
    let cancelled = false;
    fetch("/api/office-loans", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (
          ((await response.json()) as { loans?: SerializedOfficeLoan[] }) ??
          null
        );
      })
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.loans)) {
          setOfficeLoans(data.loans);
        }
        if (!cancelled) setLoansLoaded(true);
      })
      .catch(() => {
        // The settlement data still prints if loans fail to load.
      });
    return () => {
      cancelled = true;
    };
  }, [isManager]);

  const report = useMemo(
    () => members.find((m) => m.memberId === selectedId) ?? null,
    [members, selectedId]
  );

  const isOwnReport = isManager && report?.memberId === currentMemberId;

  const averageRate = useMemo(() => {
    if (!report || report.meals <= 0) return null;
    return report.mealCost / report.meals;
  }, [report]);

  const loanSummary = useMemo<MemberReportLoanSummary | null>(() => {
    if (!isOwnReport || !loansLoaded) return null;
    const loans = officeLoans;
    const totalLoaned = roundMoney(
      loans.reduce((sum, loan) => sum + loan.amount, 0)
    );
    const totalRepaid = roundMoney(
      loans.reduce((sum, loan) => sum + sumRepayments(loan), 0)
    );
    const remainingBalance = roundMoney(
      loans.reduce(
        (sum, loan) => sum + (loan.amount - sumRepayments(loan)),
        0
      )
    );
    return {
      loanCount: loans.length,
      totalLoaned,
      totalRepaid,
      remainingBalance,
    };
  }, [isOwnReport, loansLoaded, officeLoans]);

  const data = useMemo<MemberReportData | null>(() => {
    if (!report) return null;
    return {
      memberName: report.memberName,
      memberType: report.memberType,
      month,
      meals: report.meals,
      averageRate,
      mealCost: report.mealCost,
      advance: report.advance,
      due: report.due,
      eggPieces: report.eggPieces,
      eggCost: report.eggCost,
      guestMeals: report.guestMeals,
      guestCost: report.guestCost,
      loanSummary,
    };
  }, [report, averageRate, loanSummary, month]);

  const ownName = members.find((m) => m.memberId === currentMemberId)
    ?.memberName;

  return (
    <div className="space-y-4">
      <div className="member-report-toolbar glass-strong rounded-2xl border app-border p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {isManager ? (
            <div className="flex items-center gap-2">
              <label
                htmlFor="member-report-member"
                className="shrink-0 text-xs font-medium uppercase tracking-wide app-text-muted"
              >
                {t(lang, "pages.memberReport.memberLabel")}
              </label>
              <select
                id="member-report-member"
                value={selectedId}
                onChange={(event) =>
                  setSelectedId((event.target as HTMLSelectElement).value)
                }
                disabled={members.length === 0}
                className="glass w-full min-w-0 rounded-xl px-3 py-2.5 text-sm app-text outline-none transition-colors focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={t(lang, "pages.memberReport.selectMember")}
              >
                {members.map((member) => (
                  <option key={member.memberId} value={member.memberId}>
                    {member.memberName}
                  </option>
                ))}
                {members.length === 0 && (
                  <option value="">
                    {t(lang, "pages.memberReport.noMembers")}
                  </option>
                )}
              </select>
            </div>
          ) : (
            <span className="text-xs font-medium uppercase tracking-wide app-text-muted">
              {t(lang, "pages.memberReport.memberLabel")}: {ownName ?? "—"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <MonthSelector />
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="shrink-0 rounded-xl"
          >
            <Printer className="size-4" />
            {t(lang, "pages.memberReport.print")}
          </Button>
        </div>
      </div>

      {members.length === 0 || !data ? (
        <p className="rounded-xl border app-border app-surface px-4 py-3 text-sm app-text-faint">
          {members.length === 0
            ? t(lang, "pages.memberReport.noMembers")
            : t(lang, "pages.memberReport.noMemberData")}
        </p>
      ) : (
        <MemberReportSheet data={data} lang={lang} />
      )}
    </div>
  );
}

function MemberReportSheet({
  data,
  lang,
}: {
  data: MemberReportData;
  lang: Lang;
}) {
  const {
    memberName,
    memberType,
    month,
    meals,
    averageRate,
    mealCost,
    advance,
    due,
    eggPieces,
    eggCost,
    guestMeals,
    guestCost,
    loanSummary,
  } = data;

  const money = (value: number) => formatAmount(value, lang);
  const dueTone: StatTone =
    due > 0 ? "danger" : due < 0 ? "emerald" : "faint";

  const stats = [
    {
      label: t(lang, "pages.memberReport.totalMeals"),
      value: meals > 0 ? String(meals) : "—",
      tone: "emerald" as StatTone,
      icon: <UtensilsCrossed />,
    },
    {
      label: t(lang, "pages.memberReport.averageRate"),
      value: averageRate !== null ? money(averageRate) : "—",
      tone: "orange" as StatTone,
      icon: <Scale />,
    },
    {
      label: t(lang, "pages.monthly.mealCost"),
      value: mealCost > 0 ? money(mealCost) : "—",
      tone: "emerald" as StatTone,
      icon: <Receipt />,
    },
    {
      label: t(lang, "pages.monthly.advance"),
      value: advance > 0 ? money(advance) : "—",
      tone: "emerald" as StatTone,
      icon: <Wallet />,
    },
    {
      label: t(lang, "pages.monthly.due"),
      value: money(due),
      tone: dueTone,
      icon: <TrendingUp />,
    },
  ];

  const detailRows = [
    { label: t(lang, "pages.monthly.memberType"), value: badgeLabel(lang, memberType) },
    { label: t(lang, "pages.memberReport.eggPieces"), value: eggPieces > 0 ? String(eggPieces) : "—" },
    { label: t(lang, "pages.monthly.eggCost"), value: zeroOrAmount(eggCost, lang) },
    { label: t(lang, "pages.memberReport.guestMeals"), value: guestMeals > 0 ? String(guestMeals) : "—" },
    { label: t(lang, "pages.monthly.guestCost"), value: zeroOrAmount(guestCost, lang) },
  ];

  const loanRows = loanSummary
    ? [
        {
          label: t(lang, "pages.memberReport.totalLoaned"),
          value: money(loanSummary.totalLoaned),
        },
        {
          label: t(lang, "pages.officeLoans.totalRepaid"),
          value: money(loanSummary.totalRepaid),
        },
        {
          label: t(lang, "pages.officeLoans.remainingBalance"),
          value: money(loanSummary.remainingBalance),
        },
        {
          label: t(lang, "pages.memberReport.loanCount"),
          value: String(loanSummary.loanCount),
        },
      ]
    : [];

  return (
    <>
      <style>{MEMBER_REPORT_PRINT_CSS}</style>
      <div className="mr-sheet">
        <div className="mr-header">
          <div className="mr-header-brand">
            <div className="mr-header-mark">
              <img src="/logo.png" alt="Mess Manager" />
            </div>
            <span className="mr-header-brand-name">Mess Manager</span>
          </div>
          <p className="mr-header-kicker">{t(lang, "pages.memberReport.title")}</p>
          <h1 className="mr-header-title">{memberName}</h1>
          <p className="mr-header-subtitle">{month}</p>
          <span className="mr-header-role">{badgeLabel(lang, memberType)}</span>
        </div>

        <div className="mr-body">
          <div className="mr-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="mr-stat">
                <div
                  className="mr-stat-icon"
                  style={{ backgroundColor: TONE_TINTS[stat.tone] }}
                >
                  <span style={{ color: TONE_COLORS[stat.tone] }}>
                    {stat.icon}
                  </span>
                </div>
                <div className="mr-stat-value">{stat.value}</div>
                <div className="mr-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mr-sections">
            <section className="mr-section">
              <h3 className="mr-section-title">
                {t(lang, "pages.memberReport.details")}
              </h3>
              {detailRows.map((row) => (
                <div key={row.label} className="mr-row">
                  <span className="mr-row-label">{row.label}</span>
                  <span className="mr-row-value">{row.value}</span>
                </div>
              ))}
            </section>

            {loanRows.length > 0 && (
              <section className="mr-section">
                <h3 className="mr-section-title">
                  {t(lang, "pages.memberReport.officeLoan")}
                </h3>
                {loanRows.map((row) => (
                  <div key={row.label} className="mr-row">
                    <span className="mr-row-label">{row.label}</span>
                    <span className="mr-row-value">{row.value}</span>
                  </div>
                ))}
              </section>
            )}
          </div>

          <div className="mr-footer">
            <span>Mess Manager</span>
            <span>{month}</span>
          </div>
        </div>
      </div>
    </>
  );
}
