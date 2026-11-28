import { Db, ObjectId } from "mongodb";
import type { Lang } from "./lang";
import { sendMemberPush } from "./push";
import {
  COLLECTIONS,
  type AppNotification,
  type LocalizedText,
  type MealOffDecision,
  type NotificationType,
} from "./models";

export interface SerializedNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedRequestId: string | null;
  link: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface CreateNotificationInput {
  recipientMemberId: ObjectId;
  recipientUserId?: string | null;
  type: NotificationType;
  title: LocalizedText;
  message: LocalizedText;
  relatedRequestId?: ObjectId | null;
  link?: string | null;
  dedupeKey: string;
}

let indexesReady: Promise<void> | null = null;

async function ensureIndexes(db: Db): Promise<void> {
  if (!indexesReady) {
    indexesReady = (async () => {
      const collection = db.collection<AppNotification>(COLLECTIONS.notifications);
      await Promise.all([
        collection.createIndex(
          { dedupeKey: 1 },
          { unique: true, sparse: true, name: "uniq_notification_dedupe_key" }
        ),
        collection.createIndex(
          { recipientMemberId: 1, createdAt: -1 },
          { name: "notification_recipient_created" }
        ),
        collection.createIndex(
          { recipientMemberId: 1, readAt: 1 },
          { name: "notification_recipient_read" }
        ),
      ]);
    })().catch((error: unknown) => {
      indexesReady = null;
      throw error;
    });
  }
  return indexesReady;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function toIsoString(value: Date | string | undefined | null): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

/**
 * Idempotent delivery. A unique `dedupeKey` plus upsert means retried triggers
 * cannot create a second notification for the same request event.
 */
export async function createNotification(
  db: Db,
  input: CreateNotificationInput
): Promise<void> {
  try {
    await ensureIndexes(db);
  } catch {
    // Notification delivery must never break the underlying meal-off request.
  }

  try {
    await db
      .collection<AppNotification>(COLLECTIONS.notifications)
      .updateOne(
        { dedupeKey: input.dedupeKey },
        {
          $setOnInsert: {
            ...input,
            createdAt: new Date(),
            readAt: null,
          },
        },
        { upsert: true }
      );
    const saved = await db.collection<AppNotification>(COLLECTIONS.notifications).findOne({ dedupeKey: input.dedupeKey });
    if (saved) await sendMemberPush(db, saved).catch(() => undefined);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
}

export function serializeNotification(
  notification: AppNotification,
  lang: Lang
): SerializedNotification {
  return {
    id: notification._id?.toString() ?? "",
    type: notification.type,
    title: notification.title[lang],
    message: notification.message[lang],
    relatedRequestId: notification.relatedRequestId?.toString() ?? null,
    link: notification.link ?? null,
    createdAt: toIsoString(notification.createdAt),
    readAt: toIsoString(notification.readAt) || null,
  };
}

export function mealOffNotificationLink(month: string): string {
  return `/dashboard/meal-board?month=${encodeURIComponent(month)}`;
}

export function mealOffSubmittedDedupeKey(requestId: string): string {
  return `meal-off:${requestId}:submitted`;
}

export function mealOffDecisionDedupeKey(requestId: string): string {
  return `meal-off:${requestId}:decision`;
}

export function mealOffSubmittedContent(
  memberName: string,
  month: string,
  date: number
): { title: LocalizedText; message: LocalizedText } {
  return {
    title: { bn: "নতুন মিল অফ অনুরোধ", en: "New meal off request" },
    message: {
      bn: `${memberName} ${month}/${date} তারিখের জন্য মিল অফ অনুরোধ করেছেন।`,
      en: `${memberName} requested meal off for ${month}/${date}.`,
    },
  };
}

export function mealOffDecisionContent(
  decision: MealOffDecision,
  month: string,
  date: number
): { title: LocalizedText; message: LocalizedText } {
  const approved = decision === "approved";
  return {
    title: {
      bn: approved ? "মিল অফ অনুমোদিত" : "মিল অফ প্রত্যাখ্যাত",
      en: approved ? "Meal off approved" : "Meal off rejected",
    },
    message: {
      bn: approved
        ? `${month}/${date} তারিখের আপনার মিল অফ অনুরোধ অনুমোদন করা হয়েছে।`
        : `${month}/${date} তারিখের আপনার মিল অফ অনুরোধ প্রত্যাখ্যান করা হয়েছে।`,
      en: approved
        ? `Your meal off request for ${month}/${date} was approved.`
        : `Your meal off request for ${month}/${date} was rejected.`,
    },
  };
}
