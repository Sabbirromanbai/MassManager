import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrLinkMember } from "@/lib/currentMember";
import { getCurrentMonth } from "@/lib/manager";
import { getManagerRotationIndex } from "@/lib/manager";
import { getMonthlySettlement } from "@/lib/stats";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MonthlyClient } from "./MonthlyClient";
import { Lang } from "@/lib/lang";
import { Calendar } from "lucide-react";

interface MonthlyPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function getSessionMember() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { user: null, member: null, lang: "bn" as Lang };

  const user = session.user;
  const member = await getOrLinkMember({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
  });

  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";

  return { user, member, lang };
}

export default async function MonthlyPage({ searchParams }: MonthlyPageProps) {
  const { user, member, lang } = await getSessionMember();

  if (!user || !member) {
    return (
      <div className="space-y-6">
        <PageHeader
          titleKey="pages.monthly.title"
          subtitleKey="pages.monthly.subtitle"
          currentLang={lang}
          delay={0}
          icon={<Calendar className="size-5" />}
        />
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month ?? getCurrentMonth();
  const isManager = member.rotationOrder === getManagerRotationIndex(month);

  const settlement = await getMonthlySettlement(month);

  const serializedMembers = settlement.members.map((m) => ({
    memberId: m.memberId,
    memberName: m.memberName,
    memberType: m.memberType,
    meals: m.meals,
    mealCost: m.mealCost,
    eggPieces: m.eggPieces,
    eggCost: m.eggCost,
    guestMeals: m.guestMeals,
    guestCost: m.guestCost,
    advance: m.advance,
    due: m.due,
  }));

  const totals = isManager
    ? {
        totalBazar: settlement.totalBazar,
        totalAdvance: settlement.totalAdvance,
        totalMeal: settlement.totalMeal,
        mealRate: settlement.mealRate,
        cashInHand: settlement.cashInHand,
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.monthly.title"
        subtitleKey="pages.monthly.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
        icon={<Calendar className="size-5" />}
      />
      <MonthlyClient
        lang={lang}
        month={month}
        isManager={isManager}
        currentMemberId={member._id!.toString()}
        members={serializedMembers}
        totals={totals}
      />
    </div>
  );
}