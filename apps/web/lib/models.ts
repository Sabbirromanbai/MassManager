import { ObjectId } from "mongodb";

export const COLLECTIONS = {
  members: "members",
  meals: "meals",
  bazarEntries: "bazarEntries",
  advances: "advances",
  eggEntries: "eggEntries",
  guestMeals: "guestMeals",
  mealOffRequests: "mealOffRequests",
  months: "months",
  officeLoans: "officeLoans",
  notifications: "notifications",
  pushSubscriptions: "pushSubscriptions",
} as const;

export type MemberType = "regular" | "eggOnly" | "guest";

export interface Member {
  _id?: ObjectId | string;
  userId?: string | null;
  email?: string | null;
  name: string;
  type: MemberType;
  isActive: boolean;
  rotationOrder: number | null;
  createdAt: Date;
  /** Normalized Bangladesh mobile digits (8801XXXXXXXXX); absent for legacy members. */
  whatsappNumber?: string | null;
}

export interface Meal {
  _id?: ObjectId;
  memberId: ObjectId;
  month: string;
  date: number;
  count: number;
  createdBy: ObjectId;
  createdAt: Date;
}

export interface BazarEntry {
  _id?: ObjectId;
  month: string;
  date: number;
  day: string;
  description: string;
  amount: number;
  createdBy: ObjectId;
  createdAt: Date;
}

export interface Advance {
  _id?: ObjectId;
  memberId: ObjectId;
  month: string;
  date: number;
  amount: number;
  receivedBy: ObjectId;
  createdAt: Date;
}

export interface EggEntry {
  _id?: ObjectId;
  memberId: ObjectId;
  month: string;
  date: number;
  pieces: number;
  pricePerPiece: number;
  createdAt: Date;
}

export interface GuestMeal {
  _id?: ObjectId;
  guestName: string;
  month: string;
  date: number;
  meals: number;
  ratePerMeal: number;
  createdAt: Date;
}

export type MealOffRequestStatus = "pending" | "approved" | "rejected";
export type MealOffDecision = "approved" | "rejected";

export interface MealOffRequest {
  _id?: ObjectId;
  memberId: ObjectId;
  month: string;
  date: number;
  /** `done` is kept for records created before explicit approvals existed. */
  status: MealOffRequestStatus | "done";
  decision?: MealOffDecision;
  decidedBy?: ObjectId;
  decidedByName?: string;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Month {
  _id?: ObjectId;
  month: string;
  managerId: ObjectId;
  isLocked: boolean;
  closedAt?: Date;
}

/** Office-loan data is deliberately isolated from meals, bazar and advances. */
export interface OfficeLoanRepayment {
  _id?: ObjectId;
  amount: number;
  date: string;
  note?: string;
  createdAt: Date;
}

export interface OfficeLoan {
  _id?: ObjectId;
  /** The current manager who recorded the loan (their member ID). */
  memberId: ObjectId;
  amount: number;
  date: string;
  note: string;
  repayments: OfficeLoanRepayment[];
  createdAt: Date;
}

export type NotificationType =
  | "mealOffRequested"
  | "mealOffApproved"
  | "mealOffRejected";

export interface LocalizedText {
  bn: string;
  en: string;
}

export interface PushSubscriptionRecord {
  _id?: ObjectId;
  memberId: ObjectId;
  subscription: { endpoint: string; expirationTime?: number | null; keys: { p256dh: string; auth: string } };
  createdAt: Date;
  updatedAt: Date;
}

/** Member-scoped inbox records. `dedupeKey` makes event delivery idempotent. */
export interface AppNotification {
  _id?: ObjectId;
  recipientMemberId: ObjectId;
  recipientUserId?: string | null;
  type: NotificationType;
  title: LocalizedText;
  message: LocalizedText;
  relatedRequestId?: ObjectId | null;
  link?: string | null;
  dedupeKey?: string | null;
  createdAt: Date;
  readAt?: Date | null;
}