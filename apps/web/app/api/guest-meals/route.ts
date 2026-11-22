import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import {
  createGuestMealRequestSchema,
  deleteGuestMealRequestSchema,
} from "@/lib/schemas";
import { GuestMeal, Member } from "@/lib/models";
import { GUEST_RATE_PER_MEAL } from "@/lib/mealBoard";

async function getSessionMember(): Promise<{
  user: { id: string; name: string; email: string } | null;
  member: Member | null;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { user: null, member: null };

  const user = session.user;
  const member = await getOrLinkMember({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
  });

  return {
    user: { id: user.id, name: user.name, email: user.email ?? "" },
    member,
  };
}

export async function POST(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember.user || !sessionMember.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isCurrentManagerMember(sessionMember.member)) {
      return NextResponse.json(
        { error: "Only managers can add guest meals" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const validation = createGuestMealRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { month, date, meals } = validation.data;

    const db = await getDb();
    const members = db.collection<Member>("members");
    const guestMeals = db.collection<GuestMeal>("guestMeals");

    const guestMember = await members.findOne({ type: "guest", isActive: true });
    if (!guestMember) {
      return NextResponse.json(
        { error: "No active guest member found" },
        { status: 400 }
      );
    }

    const existing = await guestMeals.findOne({ month, date });
    if (existing) {
      return NextResponse.json(
        { error: "This date already has a guest meal entry" },
        { status: 409 }
      );
    }

    const result = await guestMeals.insertOne({
      guestName: guestMember.name,
      month,
      date,
      meals,
      ratePerMeal: GUEST_RATE_PER_MEAL,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch {
    return NextResponse.json(
      { error: "Failed to add guest meal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember.user || !sessionMember.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isCurrentManagerMember(sessionMember.member)) {
      return NextResponse.json(
        { error: "Only managers can remove guest meals" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const validation = deleteGuestMealRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { month, date } = validation.data;

    const db = await getDb();
    const guestMeals = db.collection<GuestMeal>("guestMeals");

    const result = await guestMeals.deleteOne({ month, date });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Guest meal entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove guest meal" },
      { status: 500 }
    );
  }
}
