import { Db, ObjectId, Collection } from "mongodb";
import { getDb } from "./db";
import { EggEntry, GuestMeal, Member, MemberType } from "./models";

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

export interface MemberSettlement {
  memberId: string;
  memberName: string;
  memberType: MemberType;
  meals: number;
  mealCost: number;
  eggPieces: number;
  eggCost: number;
  guestMeals: number;
  guestCost: number;
  advance: number;
  due: number;
}

export interface MonthlySettlement {
  month: string;
  totalBazar: number;
  totalAdvance: number;
  totalMeal: number;
  mealRate: number;
  cashInHand: number;
  members: MemberSettlement[];
}

export async function getMonthlySettlement(
  month: string
): Promise<MonthlySettlement> {
  const db = await getDb();
  const memberCollection = db.collection<Member>("members");
  const mealCollection = db.collection("meals");
  const bazarCollection = db.collection("bazarEntries");
  const advanceCollection = db.collection("advances");
  const eggCollection = db.collection<EggEntry>("eggEntries");
  const guestCollection = db.collection<GuestMeal>("guestMeals");

  const members = await memberCollection
    .find({ isActive: true })
    .sort({ name: 1 })
    .toArray();

  const [
    totalBazar,
    totalAdvance,
    totalMeal,
    mealsByMember,
    advancesByMember,
    eggEntries,
    guestEntries,
  ] = await Promise.all([
    getTotalBazar(bazarCollection, month),
    getTotalAdvance(advanceCollection, month),
    getTotalMeal(mealCollection, month),
    mealCollection
      .aggregate<{ _id: ObjectId; meals: number }>([
        { $match: { month } },
        { $group: { _id: "$memberId", meals: { $sum: "$count" } } },
      ])
      .toArray(),
    advanceCollection
      .aggregate<{ _id: ObjectId; advance: number }>([
        { $match: { month } },
        { $group: { _id: "$memberId", advance: { $sum: "$amount" } } },
      ])
      .toArray(),
    eggCollection.find({ month }).toArray(),
    guestCollection.find({ month }).toArray(),
  ]);

  const mealMap = new Map(
    mealsByMember.map((m) => [m._id.toString(), m.meals])
  );
  const advanceMap = new Map(
    advancesByMember.map((a) => [a._id.toString(), a.advance])
  );

  const mealRate = totalMeal > 0 ? totalBazar / totalMeal : 0;

  const eggByMember = new Map<string, { pieces: number; cost: number }>();
  for (const entry of eggEntries) {
    const id = entry.memberId.toString();
    const current = eggByMember.get(id) ?? { pieces: 0, cost: 0 };
    current.pieces += entry.pieces;
    current.cost += entry.pieces * entry.pricePerPiece;
    eggByMember.set(id, current);
  }

  const guestByName = new Map<string, { meals: number; cost: number }>();
  for (const entry of guestEntries) {
    const current = guestByName.get(entry.guestName) ?? { meals: 0, cost: 0 };
    current.meals += entry.meals;
    current.cost += entry.meals * entry.ratePerMeal;
    guestByName.set(entry.guestName, current);
  }

  const memberSettlements: MemberSettlement[] = members.map((member) => {
    const id = member._id!.toString();
    const type = member.type;

    const advance = advanceMap.get(id) ?? 0;

    let meals = 0;
    let mealCost = 0;
    let eggPieces = 0;
    let eggCost = 0;
    let guestMeals = 0;
    let guestCost = 0;

    if (type === "regular") {
      meals = mealMap.get(id) ?? 0;
      mealCost = meals * mealRate;
    } else if (type === "eggOnly") {
      const egg = eggByMember.get(id);
      eggPieces = egg?.pieces ?? 0;
      eggCost = egg?.cost ?? 0;
    } else if (type === "guest") {
      const guest = guestByName.get(member.name);
      guestMeals = guest?.meals ?? 0;
      guestCost = guest?.cost ?? 0;
    }

    const cost = mealCost + eggCost + guestCost;
    const due = cost - advance;

    return {
      memberId: id,
      memberName: member.name,
      memberType: type,
      meals,
      mealCost,
      eggPieces,
      eggCost,
      guestMeals,
      guestCost,
      advance,
      due,
    };
  });

  return {
    month,
    totalBazar,
    totalAdvance,
    totalMeal,
    mealRate,
    cashInHand: totalAdvance - totalBazar,
    members: memberSettlements,
  };
}