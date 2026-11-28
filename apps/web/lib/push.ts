import webpush from "web-push";
import { Db } from "mongodb";
import { COLLECTIONS, type AppNotification, type PushSubscriptionRecord } from "./models";

function configured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}
export function getVapidPublicKey() { return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""; }
export async function savePushSubscription(db: Db, memberId: PushSubscriptionRecord["memberId"], subscription: PushSubscriptionRecord["subscription"]) {
  await db.collection<PushSubscriptionRecord>(COLLECTIONS.pushSubscriptions).updateOne(
    { memberId, "subscription.endpoint": subscription.endpoint },
    { $set: { memberId, subscription, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
}
export async function removePushSubscription(db: Db, memberId: PushSubscriptionRecord["memberId"], endpoint: string) {
  await db.collection<PushSubscriptionRecord>(COLLECTIONS.pushSubscriptions).deleteOne({ memberId, "subscription.endpoint": endpoint });
}
export async function sendMemberPush(db: Db, notification: AppNotification) {
  if (!configured()) return;
  const subscriptions = await db.collection<PushSubscriptionRecord>(COLLECTIONS.pushSubscriptions).find({ memberId: notification.recipientMemberId }).toArray();
  const payload = JSON.stringify({ title: notification.title.en, body: notification.message.en, url: notification.link ?? "/dashboard" });
  await Promise.all(subscriptions.map(async (record) => {
    try { await webpush.sendNotification(record.subscription, payload); }
    catch (error) {
      const status = typeof error === "object" && error !== null && "statusCode" in error ? (error as { statusCode?: number }).statusCode : undefined;
      if (status === 404 || status === 410) await db.collection<PushSubscriptionRecord>(COLLECTIONS.pushSubscriptions).deleteOne({ _id: record._id });
    }
  }));
}
