import { Db, ObjectId, Collection } from "mongodb";
import { getDb } from "./db";
import { Member } from "./models";

export interface DashboardStats {
  totalBazar: number;
  totalAdvance: number;
  totalMeal: number;
  cashInHand: number;
  mealRate: number;
  mealsPerMember: { name: string; meals: number }[];
  dailyBazar: { date: number; amount: number }[];
}

export interface DashboardMember extends Member {
  mealCount: number;
}

function getBazarCollection(db: Db): Collection {
  return db.collection("bazarEntries");
}

function getAdvanceCollection(db: Db): Collection {
  return db.collection("advances");
}

function getMealCollection(db: Db): Collection {
  return db.collection("meals");
}

function getMemberCollection(db: Db): Collection<Member> {
  return db.collection<Member>("members");
}

export async function getDashboardStats(month: string): Promise<DashboardStats> {
  const db = await getDb();
  const bazarCollection = getBazarCollection(db);
  const advanceCollection = getAdvanceCollection(db);
  const mealCollection = getMealCollection(db);
  const memberCollection = getMemberCollection(db);

  const [totalBazar, totalAdvance, totalMeal, mealsPerMember, dailyBazar] = await Promise.all([
    getTotalBazar(bazarCollection, month),
    getTotalAdvance(advanceCollection, month),
    getTotalMeal(mealCollection, month),
    getMealsPerMember(mealCollection, memberCollection, month),
    getDailyBazar(bazarCollection, month),
  ]);

  const cashInHand = totalAdvance - totalBazar;
  const mealRate = totalMeal > 0 ? totalBazar / totalMeal : 0;

  return {
    totalBazar,
    totalAdvance,
    totalMeal,
    cashInHand,
    mealRate,
    mealsPerMember,
    dailyBazar,
  };
}

async function getTotalBazar(
  collection: Collection,
  month: string
): Promise<number> {
  const result = await collection
    .aggregate<{ total: number }>([
      { $match: { month } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    .toArray();

  return result[0]?.total ?? 0;
}

async function getTotalAdvance(
  collection: Collection,
  month: string
): Promise<number> {
  const result = await collection
    .aggregate<{ total: number }>([
      { $match: { month } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    .toArray();

  return result[0]?.total ?? 0;
}

async function getTotalMeal(
  collection: Collection,
  month: string
): Promise<number> {
  const result = await collection
    .aggregate<{ total: number }>([
      { $match: { month } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ])
    .toArray();

  return result[0]?.total ?? 0;
}

async function getMealsPerMember(
  mealCollection: Collection,
  memberCollection: Collection<Member>,
  month: string
): Promise<{ name: string; meals: number }[]> {
  const mealsByMember = await mealCollection
    .aggregate<{ _id: ObjectId; meals: number }>([
      { $match: { month } },
      { $group: { _id: "$memberId", meals: { $sum: "$count" } } },
    ])
    .toArray();

  if (mealsByMember.length === 0) {
    return [];
  }

  const memberIds = mealsByMember.map((m) => m._id);
  const members = await memberCollection
    .find({ _id: { $in: memberIds } }, { projection: { name: 1 } })
    .toArray();

  const memberMap = new Map(members.map((m) => [m._id!.toString(), m.name]));

  return mealsByMember
    .map((m) => ({
      name: memberMap.get(m._id.toString()) ?? "Unknown",
      meals: m.meals,
    }))
    .sort((a, b) => b.meals - a.meals);
}

async function getDailyBazar(
  collection: Collection,
  month: string
): Promise<{ date: number; amount: number }[]> {
  const result = await collection
    .aggregate<{ _id: number; amount: number }>([
      { $match: { month } },
      { $group: { _id: "$date", amount: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const dailyMap = new Map(result.map((r) => [r._id, r.amount]));
  const daysInMonth = getDaysInMonth(month);

  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = i + 1;
    return { date, amount: dailyMap.get(date) ?? 0 };
  });
}

function getDaysInMonth(month: string): number {
  const parts = month.split("-");
  const yearStr = parts[0];
  const monthStr = parts[1];
  if (!yearStr || !monthStr) {
    return 30;
  }
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  return new Date(year, monthNum, 0).getDate();
}

export async function getAllMembers(): Promise<DashboardMember[]> {
  const db = await getDb();
  const memberCollection = getMemberCollection(db);
  return memberCollection.find({ isActive: true }).sort({ name: 1 }).toArray() as Promise<DashboardMember[]>;
}

export async function getDashboardMembersWithMeals(month: string): Promise<DashboardMember[]> {
  const db = await getDb();
  const memberCollection = getMemberCollection(db);
  const mealCollection = getMealCollection(db);

  const members = await memberCollection.find({ isActive: true }).sort({ name: 1 }).toArray() as DashboardMember[];
  const mealsByMember = await mealCollection
    .aggregate<{ _id: ObjectId; meals: number }>([
      { $match: { month } },
      { $group: { _id: "$memberId", meals: { $sum: "$count" } } },
    ])
    .toArray();

  const mealMap = new Map(mealsByMember.map((m) => [m._id.toString(), m.meals]));

  return members.map((member) => ({
    ...member,
    mealCount: mealMap.get(member._id!.toString()) ?? 0,
  }));
}