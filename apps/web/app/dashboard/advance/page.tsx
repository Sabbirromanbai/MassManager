import { cookies, headers } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { getCurrentMonth } from "@/lib/manager";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AdvanceClient } from "./AdvanceClient";
import { Lang, t } from "@/lib/lang";
import { Advance, Member } from "@/lib/models";
import { Wallet } from "lucide-react";

interface AdvancePageProps {
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

export default async function AdvancePage({ searchParams }: AdvancePageProps) {
  const { user, member, lang } = await getSessionMember();

  if (!user || !member) {
    return (
      <div className="space-y-6">
        <PageHeader
          titleKey="pages.advance.title"
          subtitleKey="pages.advance.subtitle"
          currentLang={lang}
          delay={0}
          icon={<Wallet className="size-5" />}
        />
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month ?? getCurrentMonth();
  const isManager = isCurrentManagerMember(member);

  const db = await getDb();
  const advancesCollection = db.collection<Advance>("advances");
  const membersCollection = db.collection<Member>("members");

  const allMembers = await membersCollection
    .find({ isActive: true })
    .sort({ name: 1 })
    .toArray();

  const filter: { month: string; memberId?: ObjectId } = { month };
  if (!isManager) {
    filter.memberId = member._id as ObjectId;
  }

  const entries = await advancesCollection.find(filter).sort({ date: 1, createdAt: 1 }).toArray();

  const nameMap = new Map(allMembers.map((m) => [m._id!.toString(), m.name]));

  const serialized = entries.map((entry) => ({
    id: entry._id!.toString(),
    memberId: entry.memberId.toString(),
    memberName: nameMap.get(entry.memberId.toString()) ?? "Unknown",
    month: entry.month,
    date: entry.date,
    amount: entry.amount,
    receivedBy: entry.receivedBy.toString(),
    createdAt: entry.createdAt.toISOString(),
  }));

  const serializedMembers = allMembers.map((m) => ({
    id: m._id!.toString(),
    name: m.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.advance.title"
        subtitleKey="pages.advance.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
        icon={<Wallet className="size-5" />}
      />
      <AdvanceClient
        lang={lang}
        month={month}
        isManager={isManager}
        currentMemberId={member._id!.toString()}
        members={serializedMembers}
        entries={serialized}
      />
    </div>
  );
}