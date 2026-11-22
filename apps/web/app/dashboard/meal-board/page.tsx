import { cookies, headers } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getCurrentMonth } from "@/lib/manager";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MealBoardClient } from "./MealBoardClient";
import { Lang, t } from "@/lib/lang";
import { EggEntry, GuestMeal, Member } from "@/lib/models";
import { UtensilsCrossed } from "lucide-react";

interface MealBoardPageProps {
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

function toClientMember(member: Member): Member {
  return { ...member, _id: member._id?.toString() };
}

export default async function MealBoardPage({ searchParams }: MealBoardPageProps) {
  const { user, member, lang } = await getSessionMember();

  if (!user || !member) {
    return <div className="space-y-6"><PageHeader titleKey="pages.mealBoard.title" subtitleKey="pages.mealBoard.subtitle" currentLang={lang} delay={0} /></div>;
  }

  const resolvedSearchParams = await searchParams;
  const month: string = resolvedSearchParams.month ?? getCurrentMonth();

  const isManager = isCurrentManagerMember(member);

  const db = await getDb();
  const members = db.collection("members");
  const meals = db.collection("meals");
  const eggEntries = db.collection("eggEntries");
  const mealOffRequests = db.collection("mealOffRequests");
  const guestMeals = db.collection("guestMeals");

  const allMembers = await members
    .find({ isActive: true })
    .sort({ name: 1 })
    .toArray() as Member[];

  const regularMembers = allMembers.filter((m) => m.type === "regular");
  const eggOnlyMembers = allMembers.filter((m) => m.type === "eggOnly");
  const guestMembers = allMembers.filter((m) => m.type === "guest");

  const toObjectIds = (ids: (ObjectId | string | undefined)[]): ObjectId[] =>
    ids
      .filter((id): id is ObjectId | string => id !== undefined)
      .map((id) => (id instanceof ObjectId ? id : new ObjectId(id)));

  const memberObjectIds = toObjectIds(regularMembers.map((m) => m._id));
  const eggMemberObjectIds = toObjectIds(eggOnlyMembers.map((m) => m._id));

  const [mealsData, eggEntriesData, mealOffRequestsData, guestMealsData] = await Promise.all([
    meals
      .find({ month, memberId: { $in: memberObjectIds } })
      .toArray() as Promise<{ memberId: ObjectId; date: number; count: number; _id: ObjectId }[]>,
    eggEntries
      .find({ month, memberId: { $in: eggMemberObjectIds } })
      .toArray() as Promise<EggEntry[]>,
    mealOffRequests
      .find({ month, memberId: { $in: memberObjectIds } })
      .toArray() as Promise<{ memberId: ObjectId; date: number; status: string; _id: ObjectId }[]>,
    guestMeals
      .find({ month })
      .sort({ date: 1 })
      .toArray() as Promise<GuestMeal[]>,
  ]);

  const mealsMap = new Map<string, number>();
  mealsData.forEach((meal) => {
    const key = `${meal.memberId.toString()}-${meal.date}`;
    mealsMap.set(key, meal.count);
  });

  const eggMap = new Map<string, number>();
  eggEntriesData.forEach((egg) => {
    const key = `${egg.memberId.toString()}-${egg.date}`;
    eggMap.set(key, (eggMap.get(key) ?? 0) + egg.pieces);
  });

  const mealOffMap = new Map<string, { status: string; requestId: string }>();
  mealOffRequestsData.forEach((req) => {
    const key = `${req.memberId.toString()}-${req.date}`;
    mealOffMap.set(key, { status: req.status, requestId: req._id.toString() });
  });

  const guestEntries = guestMealsData.map((entry) => ({
    date: entry.date,
    meals: entry.meals,
    ratePerMeal: entry.ratePerMeal,
  }));

  const parts = month.split("-");
  const yearStr = parts[0] ?? "";
  const monthStr = parts[1] ?? "";
  const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const currentUserMealOff = mealOffMap.get(`${(member._id?.toString() as string) || ""}-${new Date().getDate()}`);
  const dhakaNow = new Date();
  const dhakaOffset = 6 * 60;
  const utc = dhakaNow.getTime() + dhakaNow.getTimezoneOffset() * 60000;
  const dhakaTime = new Date(utc + dhakaOffset * 60000);
  const isAfter10AM = dhakaTime.getHours() >= 10;
  const today = dhakaTime.getDate();
  const currentMonth = `${dhakaTime.getFullYear()}-${String(dhakaTime.getMonth() + 1).padStart(2, "0")}`;
  const parts2 = month.split("-");
  const yearStr2 = parts2[0] ?? "";
  const monthStr2 = parts2[1] ?? "";
  const canRequestMealOff = !isAfter10AM && currentMonth === month && today <= new Date(parseInt(yearStr2), parseInt(monthStr2), 0).getDate();

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.mealBoard.title"
        subtitleKey="pages.mealBoard.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
        icon={<UtensilsCrossed className="size-5" />}
      />

      <MealBoardClient
        lang={lang}
        month={month}
        isManager={isManager}
        currentMember={toClientMember(member)}
        regularMembers={regularMembers.map(toClientMember)}
        eggOnlyMembers={eggOnlyMembers.map(toClientMember)}
        guestMembers={guestMembers.map(toClientMember)}
        mealsMap={mealsMap}
        eggMap={eggMap}
        mealOffMap={mealOffMap}
        guestEntries={guestEntries}
        days={days}
        canRequestMealOff={canRequestMealOff}
        today={today}
        currentUserMealOff={currentUserMealOff}
        dhakaTime={dhakaTime}
      />
    </div>
  );
}