import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview for {formatMonth(month)} • Manager: {managerName}
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Bazar"
          value={formatCurrency(stats.totalBazar)}
          icon={<ShoppingCart className="size-5 text-orange-500" />}
        />
        <StatCard
          title="Total Advance"
          value={formatCurrency(stats.totalAdvance)}
          icon={<Wallet className="size-5 text-blue-500" />}
        />
        <StatCard
          title="Cash in Hand"
          value={formatCurrency(stats.cashInHand)}
          icon={<Wallet className="size-5 text-green-500" />}
          variant={stats.cashInHand >= 0 ? "positive" : "negative"}
        />
        <StatCard
          title="Total Meals"
          value={stats.totalMeal.toString()}
          icon={<UtensilsCrossed className="size-5 text-purple-500" />}
        />
        {isManager && (
          <StatCard
            title="Meal Rate"
            value={formatCurrency(stats.mealRate, 2)}
            icon={<Wallet className="size-5 text-red-500" />}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Meal Overview</h2>
          <MealChart data={stats.mealsPerMember} />
        </section>

        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
          <FinancialChart data={stats.dailyBazar} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {isManager ? (
              <>
                <ActionLink
                  href="/dashboard/meal-board"
                  icon={<UtensilsCrossed className="size-5" />}
                  label="Add Meal Entry"
                />
                <ActionLink
                  href="/dashboard/bazar"
                  icon={<ShoppingCart className="size-5" />}
                  label="Add Bazar"
                />
                <ActionLink
                  href="/dashboard/advance"
                  icon={<Wallet className="size-5" />}
                  label="Add Advance"
                />
              </>
            ) : (
              <ActionLink
                href="/dashboard/meal-board"
                icon={<UtensilsCrossed className="size-5" />}
                label="Meal Off Request"
                fullWidth
              />
            )}
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Our Members</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {membersWithMeals.map((member) => (
              <div
                key={member._id?.toString()}
                className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.mealCount} meals this month
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

function formatMonth(month: string | undefined): string {
  if (!month) return "";
  const parts = month.split("-");
  const yearStr = parts[0];
  const monthStr = parts[1];
  if (!yearStr || !monthStr) return "";
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

function formatCurrency(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatType(type: string): string {
  switch (type) {
    case "regular":
      return "Regular";
    case "eggOnly":
      return "Egg Only";
    case "guest":
      return "Guest";
    default:
      return type;
  }
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

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant?: "positive" | "negative";
}

function StatCard({ title, value, icon, variant }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-6",
        variant === "negative" && "border-destructive/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 bg-muted rounded-lg">{icon}</div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
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
        "flex flex-col items-center justify-center gap-2 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-center",
        fullWidth && "lg:col-span-3"
      )}
    >
      <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}