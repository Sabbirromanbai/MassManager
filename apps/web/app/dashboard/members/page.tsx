import { cookies } from "next/headers";
import { getManagerNameForMonth, getCurrentMonth, getManagerRotationIndex } from "@/lib/manager";
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
  const managerRotationIndex = getManagerRotationIndex(month);
  const managerMemberIds = new Set(
    members
      .filter((m) => m.rotationOrder !== null && m.rotationOrder === managerRotationIndex)
      .map((m) => m._id?.toString() ?? "")
  );

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
        <div className="glass-strong rounded-2xl border border-white/15 p-8 text-center animate-fade-in-up delay-1">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <Users className="size-7" />
          </div>
          <p className="text-white/70">{t(lang, "common.noDataYet")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member, index) => {

            return (
              <div
                key={member._id?.toString()}
                className="glass rounded-2xl border border-white/10 p-4 transition-all duration-200 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/25 to-emerald-700/15">
                    <span className="text-base font-semibold text-emerald-300">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {member.name} [TEST_MARKER_XYZ]
                    </p>
                    <p className="text-xs text-white/60">
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
                  {(() => {
                    const mid = member._id?.toString() ?? "";
                    const inSet = managerMemberIds.has(mid);
                    if (!inSet) return null;
                    return (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        <User className="size-3" />
                        {t(lang, "badges.manager")}
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}