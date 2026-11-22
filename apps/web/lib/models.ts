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
} as const;

export type MemberType = "regular" | "eggOnly" | "guest";

export interface Member {
  _id?: ObjectId;
  userId?: string | null;
  email?: string | null;
  name: string;
  type: MemberType;
  isActive: boolean;
  rotationOrder: number | null;
  createdAt: Date;
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

export interface MealOffRequest {
  _id?: ObjectId;
  memberId: ObjectId;
  month: string;
  date: number;
  status: "pending" | "done";
  createdAt: Date;
}

export interface Month {
  _id?: ObjectId;
  month: string;
  managerId: ObjectId;
  isLocked: boolean;
  closedAt?: Date;
}