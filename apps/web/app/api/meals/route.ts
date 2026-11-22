import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { createMealSchema } from "@/lib/schemas";
import { z } from "zod";
import { Member } from "@/lib/models";

async function getSessionMember(): Promise<{ user: { id: string; name: string; email: string } | null; member: Member | null }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { user: null, member: null };

  const user = session.user;
  const member = await getOrLinkMember({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
  });

  return { user: { id: user.id, name: user.name, email: user.email ?? "" }, member };
}

export async function POST(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember?.user || !sessionMember?.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isManager = isCurrentManagerMember(sessionMember.member);
    if (!isManager) {
      return NextResponse.json({ error: "Only managers can add meals" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createMealSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }

    const { memberId, month, date, count } = validation.data;

    const db = await getDb();
    const meals = db.collection("meals");
    const members = db.collection("members");

    const targetMember = await members.findOne({ _id: new ObjectId(memberId) });
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.type !== "regular") {
      return NextResponse.json({ error: "Only regular members can have meals added" }, { status: 400 });
    }

    const existingMeal = await meals.findOne({
      memberId: new ObjectId(memberId),
      month,
      date,
    });

    if (existingMeal) {
      return NextResponse.json({ error: "This member already has a meal entry for this date" }, { status: 409 });
    }

    const result = await meals.insertOne({
      memberId: new ObjectId(memberId),
      month,
      date,
      count,
      createdBy: sessionMember.member._id ?? new ObjectId(),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add meal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember?.user || !sessionMember?.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isManager = isCurrentManagerMember(sessionMember.member);
    if (!isManager) {
      return NextResponse.json({ error: "Only managers can remove meals" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, month, date } = body;

    if (!memberId || !month || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();
    const meals = db.collection("meals");

    const result = await meals.deleteOne({
      memberId: new ObjectId(memberId),
      month,
      date,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Meal entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove meal" }, { status: 500 });
  }
}