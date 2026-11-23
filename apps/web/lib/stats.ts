import { Db, ObjectId, Collection } from "mongodb";
import { getDb } from "./db";
import { EggEntry, GuestMeal, Member, MemberType } from "./models";
import { calculateMealRate } from "./mealRate";
import { EGG_PRICE_PER_PIECE, GUEST_RATE_PER_MEAL } from "./mealBoard";

interface MemberMealTotal {
  memberId: string;
  meals: number;
}

interface SeparateConsumption {
  totalEggPieces: number;
  totalGuestMeals: number;
}

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

/** Meal totals keyed by member id, reused for both the chart and the rate. */
async function getMealsByMember(
  mealCollection: Collection,
  month: string
): Promise<MemberMealTotal[]> {
  const rows = await mealCollection
    .aggregate<{ _id: ObjectId; meals: number }>([
      { $match: { month } },
      { $group: { _id: "$memberId", meals: { $sum: "$count" } } },
    ])
    .toArray();

  return rows.map((row) => ({
    memberId: row._id.toString(),
    meals: row.meals,
  }));
}

/** Egg-only and guest members never count toward the regular meal divisor. */
function sumRegularMeals(
  mealsByMember: MemberMealTotal[],
  members: Member[]
): number {
  const regularIds = new Set(
    members
      .filter((member) => member.type === "regular")
      .map((member) => member._id!.toString())
  );

  return mealsByMember.reduce(
    (total, entry) =>
      total + (regularIds.has(entry.memberId) ? entry.meals : 0),
    0
  );
}

/**
 * Quantities come from the existing eggEntries / guestMeals records. Only
 * entries belonging to active egg-only / guest members are billed, matching
 * the members included in the settlement.
 */
function getSeparateConsumption(
  members: Member[],
  eggEntries: Pick<EggEntry, "memberId" | "pieces">[],
  guestEntries: Pick<GuestMeal, "guestName" | "meals">[]
): SeparateConsumption {
  const eggOnlyIds = new Set(
    members
      .filter((member) => member.type === "eggOnly")
      .map((member) => member._id!.toString())
  );
  const guestNames = new Set(
    members
      .filter((member) => member.type === "guest")
      .map((member) => member.name)
  );

  return {
    totalEggPieces: eggEntries
      .filter((entry) => eggOnlyIds.has(entry.memberId.toString()))
      .reduce((total, entry) => total + entry.pieces, 0),
    totalGuestMeals: guestEntries
      .filter((entry) => guestNames.has(entry.guestName))
      .reduce((total, entry) => total + entry.meals, 0),
  };
}

export async function getDashboardStats(month: string): Promise<DashboardStats> {
  const db = await getDb();
  const bazarCollection = getBazarCollection(db);
  const advanceCollection = getAdvanceCollection(db);
  const mealCollection = getMealCollection(db);
  const memberCollection = getMemberCollection(db);
  const eggCollection = db.collection<EggEntry>("eggEntries");
  const guestCollection = db.collection<GuestMeal>("guestMeals");

  const [
    totalBazar,
    totalAdvance,
    totalMeal,
    mealsByMember,
    members,
    eggEntries,
    guestEntries,
    dailyBazar,
  ] = await Promise.all([
    getTotalBazar(bazarCollection, month),
    getTotalAdvance(advanceCollection, month),
    getTotalMeal(mealCollection, month),
    getMealsByMember(mealCollection, month),
    memberCollection
      .find({}, { projection: { name: 1, type: 1, isActive: 1 } })
      .toArray(),
    eggCollection
      .find({ month }, { projection: { memberId: 1, pieces: 1 } })
      .toArray(),
    guestCollection
      .find({ month }, { projection: { guestName: 1, meals: 1 } })
      .toArray(),
    getDailyBazar(bazarCollection, month),
  ]);

  const activeMembers = members.filter((member) => member.isActive);
  const memberNameById = new Map(
    members.map((member) => [member._id!.toString(), member.name])
  );
  const mealsPerMember = mealsByMember
    .map((entry) => ({
      name: memberNameById.get(entry.memberId) ?? "Unknown",
      meals: entry.meals,
    }))
    .sort((a, b) => b.meals - a.meals);

  const { totalEggPieces, totalGuestMeals } = getSeparateConsumption(
    activeMembers,
    eggEntries,
    guestEntries
  );
  const { mealRate } = calculateMealRate(
    totalBazar,
    totalEggPieces,
    totalGuestMeals,
    sumRegularMeals(mealsByMember, activeMembers)
  );

  const cashInHand = totalAdvance - totalBazar;

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
    getMealsByMember(mealCollection, month),
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
    mealsByMember.map((m) => [m.memberId, m.meals])
  );
  const advanceMap = new Map(
    advancesByMember.map((a) => [a._id.toString(), a.advance])
  );

  const { totalEggPieces, totalGuestMeals } = getSeparateConsumption(
    members,
    eggEntries,
    guestEntries
  );
  const { mealRate } = calculateMealRate(
    totalBazar,
    totalEggPieces,
    totalGuestMeals,
    sumRegularMeals(mealsByMember, members)
  );

  const eggPiecesByMember = new Map<string, number>();
  for (const entry of eggEntries) {
    const id = entry.memberId.toString();
    eggPiecesByMember.set(id, (eggPiecesByMember.get(id) ?? 0) + entry.pieces);
  }

  const guestMealsByName = new Map<string, number>();
  for (const entry of guestEntries) {
    guestMealsByName.set(
      entry.guestName,
      (guestMealsByName.get(entry.guestName) ?? 0) + entry.meals
    );
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
      eggPieces = eggPiecesByMember.get(id) ?? 0;
      eggCost = eggPieces * EGG_PRICE_PER_PIECE;
    } else if (type === "guest") {
      guestMeals = guestMealsByName.get(member.name) ?? 0;
      guestCost = guestMeals * GUEST_RATE_PER_MEAL;
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