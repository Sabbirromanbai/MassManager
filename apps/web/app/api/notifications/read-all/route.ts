import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { COLLECTIONS, type AppNotification } from "@/lib/models";
import {
  notificationAuthErrorResponse,
  requireNotificationUser,
} from "@/lib/notificationAuth";

export async function PATCH() {
  try {
    const authResult = await requireNotificationUser();
    if (authResult.status !== "ok") return notificationAuthErrorResponse();

    const db = await getDb();
    const result = await db
      .collection<AppNotification>(COLLECTIONS.notifications)
      .updateMany(
        { recipientMemberId: authResult.memberId, readAt: null },
        { $set: { readAt: new Date() } }
      );

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch {
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
