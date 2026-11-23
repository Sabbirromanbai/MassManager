import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { createMealsSchema } from "@/lib/schemas";
import { Member, Meal } from "@/lib/models";

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const validation = createMealsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    const { month, date, count } = validation.data;
    const memberIds = [...new Set(validation.data.memberIds)];
    const objectIds = memberIds.map((id) => new ObjectId(id));

    const db = await getDb();
    const meals = db.collection<Meal>("meals");
    const members = db.collection<Member>("members");

    const found = await members
      .find({ _id: { $in: objectIds } }, { projection: { type: 1 } })
      .toArray();
    const foundById = new Map(found.map((member) => [member._id!.toString(), member]));

    if (memberIds.some((id) => !foundById.has(id))) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (memberIds.some((id) => foundById.get(id)?.type !== "regular")) {
      return NextResponse.json({ error: "Only regular members can have meals added" }, { status: 400 });
    }

    const manager = sessionMember.member;
    const createdBy = manager._id
      ? manager._id instanceof ObjectId
        ? manager._id
        : new ObjectId(manager._id.toString())
      : new ObjectId();
    const createdAt = new Date();

    // $setOnInsert only: an existing entry is never duplicated or overwritten.
    const result = await meals.bulkWrite(
      memberIds.map((memberId) => ({
        updateOne: {
          filter: { memberId: new ObjectId(memberId), month, date },
          // memberId/month/date come from the equality filter on insert.
          update: {
            $setOnInsert: { count, createdBy, createdAt },
          },
          upsert: true,
        },
      }))
    );

    const added = result.upsertedCount;
    const skipped = memberIds.length - added;

    return NextResponse.json({ success: true, added, skipped });
  } catch {
    return NextResponse.json({ error: "Failed to add meals" }, { status: 500 });
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