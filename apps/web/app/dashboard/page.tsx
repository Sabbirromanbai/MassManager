import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getManagerNameForMonth, getCurrentMonth } from "@/lib/manager";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { getDashboardStats, getDashboardMembersWithMeals } from "@/lib/stats";
import { MealChart } from "@/components/dashboard/MealChart";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { SignOutButton } from "./SignOutButton";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  UtensilsCrossed,
  ShoppingCart,
  Wallet,
  LayoutDashboard,
  Users,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Member } from "@/lib/models";
import { cn } from "cn";
import { Lang, t } from "@/lib/lang";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";

  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month ?? getCurrentMonth();

  const member = await getOrLinkMember({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
  });

  const isManager = member ? isCurrentManagerMember(member) : false;
  const managerName = getManagerNameForMonth(month);

  const [stats, membersWithMeals] = await Promise.all([
    getDashboardStats(month),
    getDashboardMembersWithMeals(month),
  ]);

  function formatMonth(month: string | undefined): string {
    if (!month) return "";
    const parts = month.split("-");
    const yearStr = parts[0];
    const monthStr = parts[1];
    if (!yearStr || !monthStr) return "";
    const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1);
    return date.toLocaleString(lang === "bn" ? "bn-BD" : "en-US", { month: "long", year: "numeric" });
  }

  function formatCurrency(value: number, decimals = 0): string {
    return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  function formatType(type: string): string {
    return t(lang, `badges.${type === "regular" ? "regular" : type === "eggOnly" ? "eggOnly" : "guest"}`);
  }

  function getTypeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
    switch (type) {
      case "regular":
        return "default";
      case "eggOnly":
        return "secondary";
      case "guest":
        return "outline";
      default:
        return "default";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.dashboard.title"
        subtitleKey="pages.dashboard.subtitle"
        month={formatMonth(month)}
        managerName={managerName}
        currentLang={lang}
        delay={0}
        icon={<LayoutDashboard className="size-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title={t(lang, "summary.totalBazar")}
          value={formatCurrency(stats.totalBazar)}
          icon={<ShoppingCart className="size-5" />}
          iconTint="green"
          delay={1}
        />
        <StatCard
          title={t(lang, "summary.totalAdvance")}
          value={formatCurrency(stats.totalAdvance)}
          icon={<Wallet className="size-5" />}
          iconTint="green"
          delay={2}
        />
        <StatCard
          title={t(lang, "summary.cashInHand")}
          value={formatCurrency(stats.cashInHand)}
          icon={<Wallet className="size-5" />}
          iconTint="green"
          variant={stats.cashInHand >= 0 ? "positive" : "negative"}
          delay={3}
        />
        <StatCard
          title={t(lang, "summary.totalMeal")}
          value={stats.totalMeal.toString()}
          icon={<UtensilsCrossed className="size-5" />}
          iconTint="green"
          delay={4}
        />
        {isManager && (
          <StatCard
            title={t(lang, "summary.mealRate")}
            value={formatCurrency(stats.mealRate, 2)}
            icon={<TrendingUp className="size-5" />}
            iconTint="red"
            delay={5}
          />
        )}
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <section className="glass-strong rounded-2xl border app-border p-5 md:p-6 animate-fade-in-up delay-1 hover-lift">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-tint-emerald app-text-emerald">
              <UtensilsCrossed className="size-4" />
            </div>
            <h2 className="text-base font-semibold app-text sm:text-lg">
              {t(lang, "pages.dashboard.mealOverview")}
            </h2>
          </div>
          <MealChart data={stats.mealsPerMember} lang={lang} />
        </section>

        <section className="glass-strong rounded-2xl border app-border p-5 md:p-6 animate-fade-in-up delay-2 hover-lift">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-tint-orange app-text-orange">
              <Wallet className="size-4" />
            </div>
            <h2 className="text-base font-semibold app-text sm:text-lg">
              {t(lang, "pages.dashboard.financialSummary")}
            </h2>
          </div>
          <FinancialChart data={stats.dailyBazar} lang={lang} />
        </section>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <section className="glass-strong rounded-2xl border app-border p-5 md:p-6 lg:col-span-2 animate-fade-in-up delay-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold app-text sm:text-lg">
              {t(lang, "quickActions.title")}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {isManager ? (
              <>
                <ActionLink
                  href="/dashboard/meal-board"
                  icon={<UtensilsCrossed className="size-5" />}
                  label={t(lang, "quickActions.addMealEntry")}
                />
                <ActionLink
                  href="/dashboard/bazar"
                  icon={<ShoppingCart className="size-5" />}
                  label={t(lang, "quickActions.addBazar")}
                />
                <ActionLink
                  href="/dashboard/advance"
                  icon={<Wallet className="size-5" />}
                  label={t(lang, "quickActions.addAdvance")}
                />
              </>
            ) : (
              <ActionLink
                href="/dashboard/meal-board"
                icon={<UtensilsCrossed className="size-5" />}
                label={t(lang, "quickActions.mealOffRequest")}
                fullWidth
              />
            )}
          </div>
        </section>

        <section className="glass-strong rounded-2xl border app-border p-5 md:p-6 animate-fade-in-up delay-4">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl app-tint-emerald app-text-emerald">
              <Users className="size-4" />
            </div>
            <h2 className="text-base font-semibold app-text sm:text-lg">
              {t(lang, "pages.dashboard.ourMembers")}
            </h2>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {membersWithMeals.map((member) => (
              <div
                key={member._id?.toString()}
                className="flex items-center justify-between rounded-xl border app-border app-surface px-3 py-2.5 transition-colors hover:app-surface-strong"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full app-icon-emerald">
                    <span className="text-sm font-semibold app-text-emerald">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium app-text">
                      {member.name}
                    </p>
                    <p className="text-xs app-text-muted">
                      {t(lang, "pages.dashboard.mealsThisMonth").replace(
                        "{count}",
                        member.mealCount.toString()
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant={getTypeVariant(member.type)}>
                  {formatType(member.type)}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconTint: "green" | "red";
  variant?: "positive" | "negative";
  delay?: number;
}

function StatCard({ title, value, icon, iconTint, variant, delay = 0 }: StatCardProps) {
  const tintClass =
    iconTint === "red"
      ? "app-icon-orange"
      : "app-icon-emerald";
  const delayClass = delay > 0 ? `delay-${Math.min(delay, 5)}` : "";
  return (
    <div
      className={cn(
        "glass rounded-2xl border app-border p-5 hover-lift animate-fade-in-up transition-colors",
        delayClass,
        variant === "negative" && "border-red-500/30"
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
        <p className="mt-1 break-words text-xl font-bold tabular-nums app-text sm:text-2xl">{value}</p>
      </div>
    </div>
  );
}

interface ActionLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  fullWidth?: boolean;
}

function ActionLink({ href, icon, label, fullWidth }: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "glass group flex flex-col items-center justify-center gap-2 rounded-2xl border app-border p-4 text-center transition-colors hover:app-surface-strong hover-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70",
        fullWidth && "sm:col-span-3"
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-xl app-tint-emerald app-text-emerald transition-transform duration-200 group-hover:scale-110">
        {icon}
      </div>
      <span className="text-sm font-medium app-text">{label}</span>
    </Link>
  );
}