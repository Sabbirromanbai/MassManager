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
  "glass-strong rounded-2xl border border-white/10 p-4 md:p-5 transition-all duration-200";

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Users className="size-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {t(lang, "pages.monthly.settlement")}
            </h3>
          </div>

          {empty ? (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50">
              {t(lang, "pages.monthly.noData")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm text-white/90">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="sticky left-0 z-10 bg-white/10 backdrop-blur-sm p-2 text-left font-medium text-white/70">
                      {t(lang, "pages.monthly.member")}
                    </th>
                    <th className="p-2 text-center font-medium text-white/70">
                      {t(lang, "pages.monthly.meals")}
                    </th>
                    <th className="p-2 text-right font-medium text-white/70">
                      {t(lang, "pages.monthly.mealCost")}
                    </th>
                    <th className="p-2 text-right font-medium text-white/70">
                      {t(lang, "pages.monthly.eggCost")}
                    </th>
                    <th className="p-2 text-right font-medium text-white/70">
                      {t(lang, "pages.monthly.guestCost")}
                    </th>
                    <th className="p-2 text-right font-medium text-white/70">
                      {t(lang, "pages.monthly.advance")}
                    </th>
                    <th className="sticky right-0 z-10 bg-white/10 backdrop-blur-sm p-2 text-right font-medium text-white/70">
                      {t(lang, "pages.monthly.due")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.memberId}
                      className="border-b border-white/10 transition-colors hover:bg-white/5"
                    >
                      <td className="sticky left-0 z-10 bg-white/10 backdrop-blur-sm p-2 font-medium text-white">
                        <div className="flex flex-col">
                          <span>{member.memberName}</span>
                          <span className="text-[10px] uppercase tracking-wide text-white/40">
                            {t(lang, `badges.${member.memberType === "eggOnly" ? "eggOnly" : member.memberType === "guest" ? "guest" : "regular"}`)}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-center text-white/80">
                        {member.meals > 0 ? member.meals : "—"}
                      </td>
                      <td className="p-2 text-right text-white/80">
                        {member.mealCost > 0 ? formatAmount(member.mealCost, lang) : "—"}
                      </td>
                      <td className="p-2 text-right text-emerald-300">
                        {member.eggCost > 0 ? formatAmount(member.eggCost, lang) : "—"}
                      </td>
                      <td className="p-2 text-right text-orange-300">
                        {member.guestCost > 0 ? formatAmount(member.guestCost, lang) : "—"}
                      </td>
                      <td className="p-2 text-right text-white/80">
                        {member.advance > 0 ? formatAmount(member.advance, lang) : "—"}
                      </td>
                      <td className="sticky right-0 z-10 bg-white/10 backdrop-blur-sm p-2 text-right font-semibold">
                        <span
                          className={
                            member.due > 0
                              ? "text-red-300"
                              : member.due < 0
                              ? "text-emerald-300"
                              : "text-white/60"
                          }
                        >
                          {formatAmount(member.due, lang)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-white/10 font-bold">
                    <td className="sticky left-0 z-10 bg-white/10 backdrop-blur-sm p-2 text-white">
                      {t(lang, "pages.monthly.total")}
                    </td>
                    <td className="p-2 text-center text-white">
                      {totalMeals > 0 ? totalMeals : "—"}
                    </td>
                    <td className="p-2 text-right text-white">
                      {totalMealCost > 0 ? formatAmount(totalMealCost, lang) : "—"}
                    </td>
                    <td className="p-2 text-right text-emerald-300">
                      {totalEggCost > 0 ? formatAmount(totalEggCost, lang) : "—"}
                    </td>
                    <td className="p-2 text-right text-orange-300">
                      {totalGuestCost > 0 ? formatAmount(totalGuestCost, lang) : "—"}
                    </td>
                    <td className="p-2 text-right text-white">
                      {totalAdvance > 0 ? formatAmount(totalAdvance, lang) : "—"}
                    </td>
                    <td className="sticky right-0 z-10 bg-white/10 backdrop-blur-sm p-2 text-right">
                      <span
                        className={
                          totalDue > 0
                            ? "text-red-300"
                            : totalDue < 0
                            ? "text-emerald-300"
                            : "text-white/60"
                        }
                      >
                        {formatAmount(totalDue, lang)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className={cardClass}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t(lang, "pages.monthly.ownSummary")}
              </h3>
              <p className="text-xs text-white/50">{month}</p>
            </div>
          </div>

          {!own ? (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50">
              {t(lang, "pages.monthly.noData")}
            </p>
          ) : (
            <div className="space-y-3">
              <SummaryRow label={t(lang, "pages.monthly.meals")} value={own.meals > 0 ? String(own.meals) : "—"} />
              <SummaryRow label={t(lang, "pages.monthly.mealCost")} value={own.mealCost > 0 ? formatAmount(own.mealCost, lang) : "—"} />
              <SummaryRow label={t(lang, "pages.monthly.eggCost")} value={own.eggCost > 0 ? formatAmount(own.eggCost, lang) : "—"} />
              <SummaryRow label={t(lang, "pages.monthly.guestCost")} value={own.guestCost > 0 ? formatAmount(own.guestCost, lang) : "—"} />
              <SummaryRow label={t(lang, "pages.monthly.advance")} value={own.advance > 0 ? formatAmount(own.advance, lang) : "—"} />
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-sm font-medium text-white">
                  {t(lang, "pages.monthly.due")}
                </span>
                <span
                  className={cn(
                    "text-base font-bold",
                    own.due > 0
                      ? "text-red-300"
                      : own.due < 0
                      ? "text-emerald-300"
                      : "text-white/60"
                  )}
                >
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
      ? "bg-gradient-to-br from-orange-500/25 to-orange-700/15 text-orange-300"
      : tint === "red"
      ? "bg-gradient-to-br from-red-500/25 to-red-700/15 text-red-300"
      : "bg-gradient-to-br from-emerald-500/25 to-emerald-700/15 text-emerald-300";
  const delayClass = delay > 0 ? `delay-${Math.min(delay, 5)}` : "";
  return (
    <div
      className={cn(
        "glass rounded-2xl border border-white/15 p-5 hover-lift animate-fade-in-up transition-colors",
        delayClass
      )}
    >
      <div className="flex items-center justify-between">
        <div className={`flex size-10 items-center justify-center rounded-xl ${tintClass}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-white/60">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
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
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}