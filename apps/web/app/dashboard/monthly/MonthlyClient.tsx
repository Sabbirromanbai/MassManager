"use client";

import { cn } from "cn";
import { Lang, t } from "@/lib/lang";
import type { MemberSettlement } from "@/lib/stats";
import { Wallet, Receipt, TrendingUp, Users, Scale } from "lucide-react";

export interface MonthlyTotals {
  totalBazar: number;
  totalAdvance: number;
  totalMeal: number;
  mealRate: number;
  cashInHand: number;
}

export interface MonthlyMemberView extends MemberSettlement {}

interface MonthlyClientProps {
  lang: Lang;
  month: string;
  isManager: boolean;
  currentMemberId: string;
  members: MonthlyMemberView[];
  totals: MonthlyTotals | null;
}

const cardClass =
  "glass-strong rounded-2xl border app-border p-4 md:p-5 transition-all duration-200";

function formatAmount(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function dueClass(due: number): string {
  return due > 0 ? "app-text-danger" : due < 0 ? "app-text-emerald" : "app-text-faint";
}

function typeKey(type: string): string {
  return type === "eggOnly" ? "eggOnly" : type === "guest" ? "guest" : "regular";
}

export function MonthlyClient({
  lang,
  month,
  isManager,
  currentMemberId,
  members,
  totals,
}: MonthlyClientProps) {
  const empty = members.length === 0;

  const totalDue = members.reduce((sum, m) => sum + m.due, 0);
  const totalMeals = members.reduce((sum, m) => sum + m.meals, 0);
  const totalMealCost = members.reduce((sum, m) => sum + m.mealCost, 0);
  const totalEggCost = members.reduce((sum, m) => sum + m.eggCost, 0);
  const totalGuestCost = members.reduce((sum, m) => sum + m.guestCost, 0);
  const totalAdvance = members.reduce((sum, m) => sum + m.advance, 0);

  const own = members.find((m) => m.memberId === currentMemberId);

  return (
    <div className="space-y-6">
      {isManager && totals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title={t(lang, "pages.monthly.totalBazar")}
            value={formatAmount(totals.totalBazar, lang)}
            icon={<Receipt className="size-5" />}
            tint="emerald"
            delay={1}
          />
          <SummaryCard
            title={t(lang, "pages.monthly.totalAdvance")}
            value={formatAmount(totals.totalAdvance, lang)}
            icon={<Wallet className="size-5" />}
            tint="emerald"
            delay={2}
          />
          <SummaryCard
            title={t(lang, "pages.monthly.totalMeal")}
            value={formatNumber(totals.totalMeal)}
            icon={<TrendingUp className="size-5" />}
            tint="emerald"
            delay={3}
          />
          <SummaryCard
            title={t(lang, "pages.monthly.mealRate")}
            value={formatAmount(totals.mealRate, lang)}
            icon={<Scale className="size-5" />}
            tint="orange"
            delay={4}
          />
          <SummaryCard
            title={t(lang, "pages.monthly.cashInHand")}
            value={formatAmount(totals.cashInHand, lang)}
            icon={<Wallet className="size-5" />}
            tint={totals.cashInHand >= 0 ? "emerald" : "red"}
            delay={5}
          />
        </div>
      )}

      {isManager ? (
        <section className={cardClass}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-icon-emerald">
              <Users className="size-4" />
            </div>
            <h3 className="text-base font-semibold app-text">
              {t(lang, "pages.monthly.settlement")}
            </h3>
          </div>

          {empty ? (
            <p className="rounded-lg border app-border app-surface px-3 py-2 text-sm app-text-faint">
              {t(lang, "pages.monthly.noData")}
            </p>
          ) : (
            <>
              {/* Mobile: compact settlement cards */}
              <div className="space-y-2 md:hidden">
                {members.map((member) => (
                  <article
                    key={member.memberId}
                    className="rounded-xl border app-border app-surface p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold app-text">
                          {member.memberName}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide app-text-faint">
                          {t(lang, `badges.${typeKey(member.memberType)}`)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-bold tabular-nums",
                          dueClass(member.due)
                        )}
                      >
                        {formatAmount(member.due, lang)}
                      </span>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <MobileStat
                        label={t(lang, "pages.monthly.meals")}
                        value={member.meals > 0 ? String(member.meals) : "—"}
                      />
                      <MobileStat
                        label={t(lang, "pages.monthly.mealCost")}
                        value={member.mealCost > 0 ? formatAmount(member.mealCost, lang) : "—"}
                      />
                      <MobileStat
                        label={t(lang, "pages.monthly.eggCost")}
                        value={member.eggCost > 0 ? formatAmount(member.eggCost, lang) : "—"}
                        accent="emerald"
                      />
                      <MobileStat
                        label={t(lang, "pages.monthly.guestCost")}
                        value={member.guestCost > 0 ? formatAmount(member.guestCost, lang) : "—"}
                        accent="orange"
                      />
                      <MobileStat
                        label={t(lang, "pages.monthly.advance")}
                        value={member.advance > 0 ? formatAmount(member.advance, lang) : "—"}
                      />
                    </dl>
                  </article>
                ))}
                <div className="flex items-center justify-between rounded-xl border app-border-strong app-surface-strong p-3 text-sm font-bold">
                  <span className="app-text">{t(lang, "pages.monthly.total")}</span>
                  <span className={cn("tabular-nums", dueClass(totalDue))}>
                    {formatAmount(totalDue, lang)}
                  </span>
                </div>
              </div>

              {/* Tablet/desktop: full settlement table */}
              <div className="hidden overflow-x-auto overscroll-x-contain md:block">
                <table className="w-full min-w-max text-sm app-text">
                  <caption className="sr-only">{t(lang, "pages.monthly.settlement")}</caption>
                  <thead>
                    <tr className="border-b app-border-strong">
                      <th
                        scope="col"
                        className="sticky left-0 z-10 app-sticky p-2 text-left font-medium app-text-muted"
                      >
                        {t(lang, "pages.monthly.member")}
                      </th>
                      <th scope="col" className="p-2 text-center font-medium app-text-muted">
                        {t(lang, "pages.monthly.meals")}
                      </th>
                      <th scope="col" className="p-2 text-right font-medium app-text-muted">
                        {t(lang, "pages.monthly.mealCost")}
                      </th>
                      <th scope="col" className="p-2 text-right font-medium app-text-muted">
                        {t(lang, "pages.monthly.eggCost")}
                      </th>
                      <th scope="col" className="p-2 text-right font-medium app-text-muted">
                        {t(lang, "pages.monthly.guestCost")}
                      </th>
                      <th scope="col" className="p-2 text-right font-medium app-text-muted">
                        {t(lang, "pages.monthly.advance")}
                      </th>
                      <th
                        scope="col"
                        className="sticky right-0 z-10 app-sticky p-2 text-right font-medium app-text-muted"
                      >
                        {t(lang, "pages.monthly.due")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.memberId}
                        className="border-b app-border transition-colors hover:app-surface"
                      >
                        <td className="sticky left-0 z-10 app-sticky p-2 font-medium app-text">
                          <div className="flex flex-col">
                            <span>{member.memberName}</span>
                            <span className="text-[10px] uppercase tracking-wide app-text-faint">
                              {t(lang, `badges.${typeKey(member.memberType)}`)}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center tabular-nums app-text-muted">
                          {member.meals > 0 ? member.meals : "—"}
                        </td>
                        <td className="p-2 text-right tabular-nums app-text-muted">
                          {member.mealCost > 0 ? formatAmount(member.mealCost, lang) : "—"}
                        </td>
                        <td className="p-2 text-right tabular-nums app-text-emerald">
                          {member.eggCost > 0 ? formatAmount(member.eggCost, lang) : "—"}
                        </td>
                        <td className="p-2 text-right tabular-nums app-text-orange">
                          {member.guestCost > 0 ? formatAmount(member.guestCost, lang) : "—"}
                        </td>
                        <td className="p-2 text-right tabular-nums app-text-muted">
                          {member.advance > 0 ? formatAmount(member.advance, lang) : "—"}
                        </td>
                        <td className="sticky right-0 z-10 app-sticky p-2 text-right font-semibold tabular-nums">
                          <span className={dueClass(member.due)}>
                            {formatAmount(member.due, lang)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="app-surface-strong font-bold">
                      <td className="sticky left-0 z-10 app-surface-strong p-2 app-text">
                        {t(lang, "pages.monthly.total")}
                      </td>
                      <td className="p-2 text-center tabular-nums app-text">
                        {totalMeals > 0 ? totalMeals : "—"}
                      </td>
                      <td className="p-2 text-right tabular-nums app-text">
                        {totalMealCost > 0 ? formatAmount(totalMealCost, lang) : "—"}
                      </td>
                      <td className="p-2 text-right tabular-nums app-text-emerald">
                        {totalEggCost > 0 ? formatAmount(totalEggCost, lang) : "—"}
                      </td>
                      <td className="p-2 text-right tabular-nums app-text-orange">
                        {totalGuestCost > 0 ? formatAmount(totalGuestCost, lang) : "—"}
                      </td>
                      <td className="p-2 text-right tabular-nums app-text">
                        {totalAdvance > 0 ? formatAmount(totalAdvance, lang) : "—"}
                      </td>
                      <td className="sticky right-0 z-10 app-surface-strong p-2 text-right tabular-nums">
                        <span className={dueClass(totalDue)}>
                          {formatAmount(totalDue, lang)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className={cardClass}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-icon-emerald">
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold app-text">
                {t(lang, "pages.monthly.ownSummary")}
              </h3>
              <p className="text-xs app-text-faint">{month}</p>
            </div>
          </div>

          {!own ? (
            <p className="rounded-lg border app-border app-surface px-3 py-2 text-sm app-text-faint">
              {t(lang, "pages.monthly.noData")}
            </p>
          ) : (
            <div className="space-y-3">
              <SummaryRow
                label={t(lang, "pages.monthly.meals")}
                value={own.meals > 0 ? String(own.meals) : "—"}
              />
              <SummaryRow
                label={t(lang, "pages.monthly.mealCost")}
                value={own.mealCost > 0 ? formatAmount(own.mealCost, lang) : "—"}
              />
              <SummaryRow
                label={t(lang, "pages.monthly.eggCost")}
                value={own.eggCost > 0 ? formatAmount(own.eggCost, lang) : "—"}
              />
              <SummaryRow
                label={t(lang, "pages.monthly.guestCost")}
                value={own.guestCost > 0 ? formatAmount(own.guestCost, lang) : "—"}
              />
              <SummaryRow
                label={t(lang, "pages.monthly.advance")}
                value={own.advance > 0 ? formatAmount(own.advance, lang) : "—"}
              />
              <div className="flex items-center justify-between rounded-lg border app-border app-surface px-3 py-2">
                <span className="text-sm font-medium app-text">
                  {t(lang, "pages.monthly.due")}
                </span>
                <span className={cn("text-base font-bold tabular-nums", dueClass(own.due))}>
                  {formatAmount(own.due, lang)}
                </span>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  tint: "emerald" | "orange" | "red";
  delay?: number;
}

function SummaryCard({ title, value, icon, tint, delay = 0 }: SummaryCardProps) {
  const tintClass =
    tint === "orange"
      ? "app-icon-orange"
      : tint === "red"
        ? "app-icon-amber app-text-danger"
        : "app-icon-emerald";
  const delayClass = delay > 0 ? `delay-${Math.min(delay, 5)}` : "";
  return (
    <div
      className={cn(
        "glass rounded-2xl border app-border p-5 hover-lift animate-fade-in-up transition-colors",
        delayClass
      )}
    >
      <div className="flex items-center justify-between">
        <div className={`flex size-10 items-center justify-center rounded-xl ${tintClass}`}>
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

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border app-border app-surface px-3 py-2">
      <span className="text-sm app-text-muted">{label}</span>
      <span className="text-sm font-medium tabular-nums app-text">{value}</span>
    </div>
  );
}

function MobileStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "orange";
}) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-2">
      <dt className="truncate text-[11px] app-text-faint">{label}</dt>
      <dd
        className={cn(
          "shrink-0 tabular-nums",
          accent === "emerald"
            ? "app-text-emerald"
            : accent === "orange"
              ? "app-text-orange"
              : "app-text-muted"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
