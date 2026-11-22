import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { z } from "zod";
import { Member } from "@/lib/models";

const mealOffRequestSchema = z.object({
  memberId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  date: z.number().int().min(1).max(31),
});

const updateMealOffSchema = z.object({
  requestId: z.string().min(1),
});

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

function getDhakaDate(): { month: string; date: number; hours: number } {
  const now = new Date();
  const dhakaOffset = 6 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const dhakaTime = new Date(utc + dhakaOffset * 60000);
  const year = dhakaTime.getFullYear();
  const month = String(dhakaTime.getMonth() + 1).padStart(2, "0");
  return {
    month: `${year}-${month}`,
    date: dhakaTime.getDate(),
    hours: dhakaTime.getHours(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember?.user || !sessionMember?.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = mealOffRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }

    const { memberId, month, date } = validation.data;

    if (!sessionMember.member._id || memberId !== sessionMember.member._id!.toString()) {
      return NextResponse.json({ error: "Can only request meal off for yourself" }, { status: 403 });
    }

    if (sessionMember.member.type !== "regular") {
      return NextResponse.json({ error: "Only regular members can request meal off" }, { status: 400 });
    }

    const dhaka = getDhakaDate();
    if (dhaka.month !== month || dhaka.date !== date) {
      return NextResponse.json({ error: "Can only request meal off for today" }, { status: 400 });
    }

    if (dhaka.hours >= 10) {
      return NextResponse.json({ error: "Time over, cannot request after 10:00 AM" }, { status: 400 });
    }

    const db = await getDb();
    const mealOffRequests = db.collection("mealOffRequests");

    const existing = await mealOffRequests.findOne({
      memberId: new ObjectId(memberId),
      month,
      date,
    });

    if (existing) {
      return NextResponse.json({ error: "Already requested meal off for this date" }, { status: 409 });
    }

    const result = await mealOffRequests.insertOne({
      memberId: new ObjectId(memberId),
      month,
      date,
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to request meal off" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember?.user || !sessionMember?.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isManager = isCurrentManagerMember(sessionMember.member);
    if (!isManager) {
      return NextResponse.json({ error: "Only managers can update meal off requests" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateMealOffSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }

    const { requestId } = validation.data;

    const db = await getDb();
    const mealOffRequests = db.collection("mealOffRequests");

    const result = await mealOffRequests.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status: "done", updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update meal off request" }, { status: 500 });
  }
}