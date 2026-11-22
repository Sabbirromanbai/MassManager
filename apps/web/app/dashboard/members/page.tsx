import { cookies } from "next/headers";
import { getManagerNameForMonth, getCurrentMonth } from "@/lib/manager";
import { getDashboardMembersWithMeals } from "@/lib/stats";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "cn";
import { Lang, t } from "@/lib/lang";
import { Users, User } from "lucide-react";

interface MembersPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";

  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month ?? getCurrentMonth();

  const members = await getDashboardMembersWithMeals(month);
  const managerName = getManagerNameForMonth(month);

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
        titleKey="pages.members.title"
        subtitleKey="pages.members.subtitle"
        month={month}
        managerName={managerName}
        currentLang={lang}
        delay={0}
        icon={<Users className="size-5" />}
      />

      {members.length === 0 ? (
        <div className="glass-strong animate-fade-in-up rounded-2xl p-8 text-center delay-1">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl app-icon-emerald">
            <Users className="size-7" />
          </div>
          <p className="app-text-muted">{t(lang, "common.noDataYet")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member, index) => {
            return (
              <div
                key={member._id?.toString()}
                className={cn(
                  "glass animate-fade-in-up rounded-2xl p-4 transition-all duration-200 hover-lift"
                )}
                style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full app-icon-emerald">
                    <span className="text-base font-semibold">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold app-text">
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

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={getTypeVariant(member.type)}>
                    {formatType(member.type)}
                  </Badge>
                  {member.name === managerName && (
                    <span className="inline-flex items-center gap-1 rounded-full app-tint-emerald px-2 py-0.5 text-xs font-medium app-text-emerald">
                      <User className="size-3" />
                      {t(lang, "badges.manager")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}