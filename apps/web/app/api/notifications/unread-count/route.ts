import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { COLLECTIONS, type AppNotification } from "@/lib/models";
import {
  notificationAuthErrorResponse,
  requireNotificationUser,
} from "@/lib/notificationAuth";

export async function GET() {
  try {
    const authResult = await requireNotificationUser();
    if (authResult.status !== "ok") return notificationAuthErrorResponse();

    const db = await getDb();
    const unreadCount = await db
      .collection<AppNotification>(COLLECTIONS.notifications)
      .countDocuments({
        recipientMemberId: authResult.memberId,
        readAt: null,
      });

    return NextResponse.json({ unreadCount });
  } catch {
    return NextResponse.json(
      { error: "Failed to load unread count" },
      { status: 500 }
    );
  }
}
