import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { COLLECTIONS, type PushSubscriptionRecord } from "@/lib/models";
import { requireNotificationUser, notificationAuthErrorResponse } from "@/lib/notificationAuth";
export async function GET() {
  const auth = await requireNotificationUser(); if (auth.status !== "ok") return notificationAuthErrorResponse();
  const count = await (await getDb()).collection<PushSubscriptionRecord>(COLLECTIONS.pushSubscriptions).countDocuments({ memberId: auth.memberId });
  return NextResponse.json({ enabled: count > 0 });
}
