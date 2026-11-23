import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { COLLECTIONS, type AppNotification } from "@/lib/models";
import type { Lang } from "@/lib/lang";
import { serializeNotification } from "@/lib/notifications";
import {
  notificationAuthErrorResponse,
  requireNotificationUser,
} from "@/lib/notificationAuth";

const NOTIFICATION_LIMIT = 50;

export async function GET() {
  try {
    const authResult = await requireNotificationUser();
    if (authResult.status !== "ok") return notificationAuthErrorResponse();

    const cookieStore = await cookies();
    const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";

    const db = await getDb();
    const notifications = db.collection<AppNotification>(COLLECTIONS.notifications);
    const filter = { recipientMemberId: authResult.memberId };

    const [docs, unreadCount] = await Promise.all([
      notifications
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(NOTIFICATION_LIMIT)
        .toArray(),
      notifications.countDocuments({ ...filter, readAt: null }),
    ]);

    return NextResponse.json({
      notifications: docs.map((doc) => serializeNotification(doc, lang)),
      unreadCount,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}
