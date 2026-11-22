import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import {
  createAdvanceSchema,
  updateAdvanceSchema,
} from "@/lib/schemas";
import { Advance, Member } from "@/lib/models";

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

function serializeEntry(entry: Advance & { _id: ObjectId }): {
  id: string;
  memberId: string;
  month: string;
  date: number;
  amount: number;
  receivedBy: string;
  createdAt: string;
} {
  return {
    id: entry._id.toString(),
    memberId: entry.memberId.toString(),
    month: entry.month,
    date: entry.date,
    amount: entry.amount,
    receivedBy: entry.receivedBy.toString(),
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
    const memberIdParam = request.nextUrl.searchParams.get("memberId");

    const db = await getDb();
    const advances = db.collection<Advance>("advances");
    const members = db.collection<Member>("members");

    const filter: { month?: string; memberId?: ObjectId } = {};
    if (month) filter.month = month;

    const isManager = isCurrentManagerMember(sessionMember.member);

    if (isManager) {
      if (memberIdParam) {
        try {
          filter.memberId = new ObjectId(memberIdParam);
        } catch {
          return NextResponse.json(
            { error: "Invalid member ID" },
            { status: 400 }
          );
        }
      }
    } else {
      filter.memberId = sessionMember.member._id as ObjectId;
    }

    const entries = await advances.find(filter).sort({ date: 1, createdAt: 1 }).toArray();

    // attach member names
    const memberIds = Array.from(new Set(entries.map((e) => e.memberId.toString())));
    const memberDocs = await members
      .find({ _id: { $in: memberIds.map((id) => new ObjectId(id)) } })
      .toArray();
    const nameMap = new Map(memberDocs.map((m) => [m._id!.toString(), m.name]));

    return NextResponse.json({
      entries: entries.map((entry) => ({
        ...serializeEntry(entry as Advance & { _id: ObjectId }),
        memberName: nameMap.get(entry.memberId.toString()) ?? "Unknown",
      })),
      isManager,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load advance entries" },
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
        { error: "Only managers can add advance entries" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const validation = createAdvanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { memberId, month, date, amount } = validation.data;

    const db = await getDb();
    const members = db.collection<Member>("members");
    const advances = db.collection<Advance>("advances");

    const targetMember = await members.findOne({ _id: new ObjectId(memberId) });
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const result = await advances.insertOne({
      memberId: new ObjectId(memberId),
      month,
      date,
      amount,
      receivedBy:
        sessionMember.member._id instanceof ObjectId
          ? sessionMember.member._id
          : new ObjectId(String(sessionMember.member._id)),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch {
    return NextResponse.json(
      { error: "Failed to add advance entry" },
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
        { error: "Only managers can edit advance entries" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const validation = updateAdvanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { id, memberId, month, date, amount } = validation.data;

    const db = await getDb();
    const members = db.collection<Member>("members");
    const advances = db.collection<Advance>("advances");

    const existing = await advances.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json(
        { error: "Advance entry not found" },
        { status: 404 }
      );
    }

    if (memberId !== undefined) {
      const targetMember = await members.findOne({ _id: new ObjectId(memberId) });
      if (!targetMember) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
    }

    const update: Partial<Advance> = {};
    if (memberId !== undefined) update.memberId = new ObjectId(memberId);
    if (month !== undefined) update.month = month;
    if (date !== undefined) update.date = date;
    if (amount !== undefined) update.amount = amount;

    await advances.updateOne({ _id: new ObjectId(id) }, { $set: update });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update advance entry" },
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
        { error: "Only managers can delete advance entries" },
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
    const advances = db.collection<Advance>("advances");

    const existing = await advances.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json(
        { error: "Advance entry not found" },
        { status: 404 }
      );
    }

    await advances.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete advance entry" },
      { status: 500 }
    );
  }
}