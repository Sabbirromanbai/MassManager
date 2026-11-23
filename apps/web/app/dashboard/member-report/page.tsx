import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrLinkMember } from "@/lib/currentMember";
import { getCurrentMonth, getManagerRotationIndex } from "@/lib/manager";
import { getMonthlySettlement, MemberSettlement } from "@/lib/stats";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MemberReportClient } from "./MemberReportClient";
import { Lang } from "@/lib/lang";
import { User } from "lucide-react";

interface MemberReportPageProps {
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

export default async function MemberReportPage({
  searchParams,
}: MemberReportPageProps) {
  const { user, member, lang } = await getSessionMember();

  if (!user || !member) {
    return (
      <div className="space-y-6">
        <PageHeader
          titleKey="pages.memberReport.title"
          subtitleKey="pages.memberReport.subtitle"
          currentLang={lang}
          delay={0}
          icon={<User className="size-5" />}
        />
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const requestedMonth = resolvedSearchParams.month;
  const month =
    requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)
      ? requestedMonth
      : getCurrentMonth();
  const isManager = member.rotationOrder === getManagerRotationIndex(month);
  const currentMemberId = member._id!.toString();

  const settlement = await getMonthlySettlement(month);

  // A member can only see their own report; the manager can pick any member.
  const members: MemberSettlement[] = isManager
    ? settlement.members
    : settlement.members.filter(
        (m) => m.memberId === currentMemberId
      );

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.memberReport.title"
        subtitleKey="pages.memberReport.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
        icon={<User className="size-5" />}
      />
      <MemberReportClient
        lang={lang}
        month={month}
        isManager={isManager}
        currentMemberId={currentMemberId}
        members={members}
      />
    </div>
  );
}
