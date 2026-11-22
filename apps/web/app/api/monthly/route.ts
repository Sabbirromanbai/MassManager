import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrLinkMember } from "@/lib/currentMember";
import { getManagerRotationIndex } from "@/lib/manager";
import { getMonthlySettlement } from "@/lib/stats";
import { Member } from "@/lib/models";

async function getSessionMember() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = session.user;
  const member = await getOrLinkMember({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
  });

  if (!member) return null;
  return { user, member };
}

export async function GET(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Month must be in YYYY-MM format" },
        { status: 400 }
      );
    }

    const isManager =
      sessionMember.member.rotationOrder ===
      getManagerRotationIndex(month);

    const settlement = await getMonthlySettlement(month);

    if (isManager) {
      return NextResponse.json({
        month: settlement.month,
        isManager: true,
        totals: {
          totalBazar: settlement.totalBazar,
          totalAdvance: settlement.totalAdvance,
          totalMeal: settlement.totalMeal,
          mealRate: settlement.mealRate,
          cashInHand: settlement.cashInHand,
        },
        members: settlement.members,
      });
    }

    const own = settlement.members.find(
      (m) => m.memberId === sessionMember.member._id?.toString()
    );

    return NextResponse.json({
      month: settlement.month,
      isManager: false,
      members: own ? [own] : [],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load monthly settlement" },
      { status: 500 }
    );
  }
}