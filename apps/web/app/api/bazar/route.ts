import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import {
  createBazarEntrySchema,
  updateBazarEntrySchema,
} from "@/lib/schemas";
import { BazarEntry, Member } from "@/lib/models";
import { getWeekdayKey } from "@/lib/mealBoard";

async function getSessionMember(): Promise<{
  user: { id: string; name: string; email: string } | null;
  member: Member | null;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { user: null, member: null };

  const user = session.user;
  const member = await getOrLinkMember({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
  });

  return {
    user: { id: user.id, name: user.name, email: user.email ?? "" },
    member,
  };
}

function serializeEntry(entry: BazarEntry & { _id: ObjectId }): {
  id: string;
  month: string;
  date: number;
  day: string;
  description: string;
  amount: number;
  createdBy: string;
  createdAt: string;
} {
  return {
    id: entry._id.toString(),
    month: entry.month,
    date: entry.date,
    day: entry.day,
    description: entry.description,
    amount: entry.amount,
    createdBy: entry.createdBy.toString(),
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember.user || !sessionMember.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get("month");
    const db = await getDb();
    const bazarEntries = db.collection<BazarEntry>("bazarEntries");

    const filter: { month?: string } = {};
    if (month) filter.month = month;

    const entries = await bazarEntries.find(filter).sort({ date: 1, createdAt: 1 }).toArray();

    return NextResponse.json({
      entries: entries.map((entry) =>
        serializeEntry(entry as BazarEntry & { _id: ObjectId })
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load bazar entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember.user || !sessionMember.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isCurrentManagerMember(sessionMember.member)) {
      return NextResponse.json(
        { error: "Only managers can add bazar entries" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const validation = createBazarEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { month, date, description, amount } = validation.data;

    const db = await getDb();
    const bazarEntries = db.collection<BazarEntry>("bazarEntries");

    const day = getWeekdayKey(date, month) ?? "mon";

    const result = await bazarEntries.insertOne({
      month,
      date,
      day,
      description,
      amount,
      createdBy:
        sessionMember.member._id instanceof ObjectId
          ? sessionMember.member._id
          : new ObjectId(String(sessionMember.member._id)),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch {
    return NextResponse.json(
      { error: "Failed to add bazar entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember.user || !sessionMember.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isCurrentManagerMember(sessionMember.member)) {
      return NextResponse.json(
        { error: "Only managers can edit bazar entries" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const validation = updateBazarEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { id, month, date, description, amount } = validation.data;

    const db = await getDb();
    const bazarEntries = db.collection<BazarEntry>("bazarEntries");

    const existing = await bazarEntries.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json(
        { error: "Bazar entry not found" },
        { status: 404 }
      );
    }

    const update: Partial<BazarEntry> = {};
    if (month !== undefined) update.month = month;
    if (date !== undefined) update.date = date;
    if (description !== undefined) update.description = description;
    if (amount !== undefined) update.amount = amount;

    const finalMonth = month ?? existing.month;
    const finalDate = date ?? existing.date;
    update.day = getWeekdayKey(finalDate, finalMonth) ?? existing.day;

    await bazarEntries.updateOne({ _id: new ObjectId(id) }, { $set: update });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update bazar entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember.user || !sessionMember.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isCurrentManagerMember(sessionMember.member)) {
      return NextResponse.json(
        { error: "Only managers can delete bazar entries" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const id =
      typeof body === "object" && body !== null && "id" in body
        ? (body as { id?: unknown }).id
        : undefined;

    if (typeof id !== "string" || id.length === 0) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const bazarEntries = db.collection<BazarEntry>("bazarEntries");

    const existing = await bazarEntries.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json(
        { error: "Bazar entry not found" },
        { status: 404 }
      );
    }

    await bazarEntries.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete bazar entry" },
      { status: 500 }
    );
  }
}