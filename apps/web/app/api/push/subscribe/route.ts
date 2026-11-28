import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { PushSubscriptionRecord } from "@/lib/models";
import { requireNotificationUser, notificationAuthErrorResponse } from "@/lib/notificationAuth";
import { removePushSubscription, savePushSubscription, getVapidPublicKey } from "@/lib/push";
export async function GET() { return NextResponse.json({ publicKey: getVapidPublicKey() }); }
export async function POST(request: NextRequest) {
  const auth = await requireNotificationUser(); if (auth.status !== "ok") return notificationAuthErrorResponse();
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("subscription" in body)) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const subscription = (body as { subscription?: unknown }).subscription;
  if (!subscription || typeof subscription !== "object" || !("endpoint" in subscription) || !("keys" in subscription)) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const endpoint = (subscription as { endpoint?: unknown }).endpoint; const keys = (subscription as { keys?: unknown }).keys;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || !keys || typeof keys !== "object" || !("p256dh" in keys) || !("auth" in keys) || typeof (keys as { p256dh?: unknown }).p256dh !== "string" || typeof (keys as { auth?: unknown }).auth !== "string") return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  try { await savePushSubscription(await getDb(), auth.memberId, subscription as PushSubscriptionRecord["subscription"]); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ error: "Push subscription unavailable. Check server VAPID configuration." }, { status: 503 }); }
}
export async function DELETE(request: NextRequest) {
  const auth = await requireNotificationUser(); if (auth.status !== "ok") return notificationAuthErrorResponse();
  const body: unknown = await request.json().catch(() => null);
  const endpoint = body && typeof body === "object" && "endpoint" in body ? (body as { endpoint?: unknown }).endpoint : null;
  if (typeof endpoint !== "string") return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  await removePushSubscription(await getDb(), auth.memberId, endpoint); return NextResponse.json({ success: true });
}
