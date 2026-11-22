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
import { UtensilsCrossed, ShoppingCart, Wallet } from "lucide-react";
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
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            icon={<Wallet className="size-5" />}
            iconTint="red"
            delay={5}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass p-6 animate-fade-in-up delay-1">
          <h2 className="text-lg font-semibold mb-4 text-white">{t(lang, "pages.dashboard.mealOverview")}</h2>
          <MealChart data={stats.mealsPerMember} />
        </section>

        <section className="glass p-6 animate-fade-in-up delay-2">
          <h2 className="text-lg font-semibold mb-4 text-white">{t(lang, "pages.dashboard.financialSummary")}</h2>
          <FinancialChart data={stats.dailyBazar} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass p-6 lg:col-span-2 animate-fade-in-up delay-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{t(lang, "quickActions.title")}</h2>
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

        <section className="glass p-6 animate-fade-in-up delay-4">
          <h2 className="text-lg font-semibold mb-4 text-white">{t(lang, "pages.dashboard.ourMembers")}</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {membersWithMeals.map((member) => (
              <div
                key={member._id?.toString()}
                className="flex items-center justify-between py-2 px-3 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-white/70">
                      {t(lang, "pages.dashboard.mealsThisMonth").replace("{count}", member.mealCount.toString())}
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
  const tintClass = iconTint === "red" ? "bg-red-500/15 text-red-500" : "bg-emerald-500/15 text-emerald-500";
  const delayClass = delay > 0 ? `delay-${Math.min(delay, 5)}` : "";
  return (
    <div
      className={cn(
        "glass p-6 animate-fade-in-up",
        delayClass,
        variant === "negative" && "border-red-500/30"
      )}
    >
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${tintClass}`}>{icon}</div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-white/70">{title}</p>
        <p className="text-2xl font-bold mt-1 text-white">{value}</p>
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
        "glass flex flex-col items-center justify-center gap-2 p-4 transition-colors text-center hover:bg-white/15",
        fullWidth && "lg:col-span-3"
      )}
    >
      <div className="p-2 bg-emerald-500/15 rounded-lg text-emerald-500">{icon}</div>
      <span className="font-medium text-sm text-white">{label}</span>
    </Link>
  );
}