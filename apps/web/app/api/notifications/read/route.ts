import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { COLLECTIONS, type AppNotification } from "@/lib/models";
import { markNotificationReadSchema } from "@/lib/schemas";
import {
  notificationAuthErrorResponse,
  requireNotificationUser,
} from "@/lib/notificationAuth";

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireNotificationUser();
    if (authResult.status !== "ok") return notificationAuthErrorResponse();

    const validation = markNotificationReadSchema.safeParse(await readJson(request));
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const notifications = db.collection<AppNotification>(COLLECTIONS.notifications);
    const filter = {
      _id: new ObjectId(validation.data.id),
      recipientMemberId: authResult.memberId,
    };

    const notification = await notifications.findOne(filter);
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (!notification.readAt) {
      await notifications.updateOne(filter, { $set: { readAt: new Date() } });
    }

    return NextResponse.json({ success: true, id: validation.data.id });
  } catch {
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
