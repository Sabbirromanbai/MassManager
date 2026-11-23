import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import {
  getCurrentManagerMember,
  getOrLinkMember,
  isCurrentManagerMember,
} from "@/lib/currentMember";
import {
  createMealOffRequestSchema,
  decideMealOffRequestSchema,
} from "@/lib/schemas";
import { COLLECTIONS, Member, MealOffRequest } from "@/lib/models";
import { serializeMealOffRequest } from "@/lib/mealOffRequests";
import {
  createNotification,
  mealOffDecisionContent,
  mealOffDecisionDedupeKey,
  mealOffNotificationLink,
  mealOffSubmittedContent,
  mealOffSubmittedDedupeKey,
} from "@/lib/notifications";

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

function toMemberObjectId(member: Member): ObjectId | null {
  if (!member._id) return null;
  return member._id instanceof ObjectId
    ? member._id
    : new ObjectId(member._id.toString());
}

export async function POST(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember?.user || !sessionMember?.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createMealOffRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues[0]?.message || "Invalid request",
        },
        { status: 400 }
      );
    }

    const { memberId, month, date } = validation.data;

    if (
      !sessionMember.member._id ||
      memberId !== sessionMember.member._id.toString()
    ) {
      return NextResponse.json(
        { error: "Can only request meal off for yourself" },
        { status: 403 }
      );
    }

    if (sessionMember.member.type !== "regular") {
      return NextResponse.json(
        { error: "Only regular members can request meal off" },
        { status: 400 }
      );
    }

    const dhaka = getDhakaDate();
    if (dhaka.month !== month || dhaka.date !== date) {
      return NextResponse.json(
        { error: "Can only request meal off for today" },
        { status: 400 }
      );
    }

    if (dhaka.hours >= 10) {
      return NextResponse.json(
        { error: "Time over, cannot request after 10:00 AM" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const mealOffRequests = db.collection<MealOffRequest>(
      COLLECTIONS.mealOffRequests
    );

    const existing = await mealOffRequests.findOne({
      memberId: new ObjectId(memberId),
      month,
      date,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already requested meal off for this date" },
        { status: 409 }
      );
    }

    const result = await mealOffRequests.insertOne({
      memberId: new ObjectId(memberId),
      month,
      date,
      status: "pending",
      createdAt: new Date(),
    });

    const requestId = result.insertedId;
    try {
      const manager = await getCurrentManagerMember();
      const managerObjectId = manager ? toMemberObjectId(manager) : null;
      if (manager && managerObjectId) {
        const content = mealOffSubmittedContent(
          sessionMember.member.name,
          month,
          date
        );
        await createNotification(db, {
          recipientMemberId: managerObjectId,
          recipientUserId: manager.userId ?? null,
          type: "mealOffRequested",
          title: content.title,
          message: content.message,
          relatedRequestId: requestId,
          link: mealOffNotificationLink(month),
          dedupeKey: mealOffSubmittedDedupeKey(requestId.toString()),
        });
      }
    } catch {
      // Notification delivery is best-effort and must not fail the request.
    }

    return NextResponse.json({ success: true, id: requestId.toString() });
  } catch {
    return NextResponse.json(
      { error: "Failed to request meal off" },
      { status: 500 }
    );
  }
}

/**
 * Manager-only decision endpoint. The `status: "pending"` filter makes the
 * transition atomic: a second approve/reject attempt cannot overwrite the
 * first decision.
 */
export async function PATCH(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember?.user || !sessionMember?.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isCurrentManagerMember(sessionMember.member)) {
      return NextResponse.json(
        { error: "Only the current manager can decide meal off requests" },
        { status: 403 }
      );
    }

    if (!sessionMember.member._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = decideMealOffRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues[0]?.message || "Invalid request",
        },
        { status: 400 }
      );
    }

    const { requestId, decision } = validation.data;
    const objectId = new ObjectId(requestId);
    const decidedAt = new Date();

    const db = await getDb();
    const mealOffRequests = db.collection<MealOffRequest>(
      COLLECTIONS.mealOffRequests
    );

    const result = await mealOffRequests.updateOne(
      { _id: objectId, status: "pending" },
      {
        $set: {
          status: decision,
          decision,
          decidedBy: new ObjectId(sessionMember.member._id.toString()),
          decidedByName: sessionMember.member.name,
          decidedAt,
          updatedAt: decidedAt,
        },
      }
    );

    if (result.matchedCount === 0) {
      const existing = await mealOffRequests.findOne({ _id: objectId });
      if (!existing) {
        return NextResponse.json(
          { error: "Meal off request not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Meal off request has already been decided" },
        { status: 409 }
      );
    }

    const updated = await mealOffRequests.findOne({ _id: objectId });
    if (!updated) {
      return NextResponse.json(
        { error: "Meal off request not found" },
        { status: 404 }
      );
    }

    try {
      const requester = await db
        .collection<Member>(COLLECTIONS.members)
        .findOne({ _id: updated.memberId });
      const content = mealOffDecisionContent(
        decision,
        updated.month,
        updated.date
      );
      await createNotification(db, {
        recipientMemberId: updated.memberId,
        recipientUserId: requester?.userId ?? null,
        type: decision === "approved" ? "mealOffApproved" : "mealOffRejected",
        title: content.title,
        message: content.message,
        relatedRequestId: objectId,
        link: mealOffNotificationLink(updated.month),
        dedupeKey: mealOffDecisionDedupeKey(objectId.toString()),
      });
    } catch {
      // The decision is already committed; delivery failure is non-blocking.
    }

    return NextResponse.json({
      success: true,
      request: serializeMealOffRequest(updated),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update meal off request" },
      { status: 500 }
    );
  }
}
