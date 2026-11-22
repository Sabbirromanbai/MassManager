import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import {
  createEggEntryRequestSchema,
  deleteEggEntryRequestSchema,
} from "@/lib/schemas";
import { EggEntry, Member } from "@/lib/models";
import { EGG_PRICE_PER_PIECE } from "@/lib/mealBoard";

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

export async function POST(request: NextRequest) {
  try {
    const sessionMember = await getSessionMember();
    if (!sessionMember.user || !sessionMember.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isCurrentManagerMember(sessionMember.member)) {
      return NextResponse.json(
        { error: "Only managers can add egg entries" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const validation = createEggEntryRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { memberId, month, date, pieces } = validation.data;

    const db = await getDb();
    const members = db.collection<Member>("members");
    const eggEntries = db.collection<EggEntry>("eggEntries");

    const targetMember = await members.findOne({ _id: new ObjectId(memberId) });
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.type !== "eggOnly") {
      return NextResponse.json(
        { error: "Only egg-only members can have eggs added" },
        { status: 400 }
      );
    }

    const existing = await eggEntries.findOne({
      memberId: new ObjectId(memberId),
      month,
      date,
    });

    if (existing) {
      return NextResponse.json(
        { error: "This member already has an egg entry for this date" },
        { status: 409 }
      );
    }

    const result = await eggEntries.insertOne({
      memberId: new ObjectId(memberId),
      month,
      date,
      pieces,
      pricePerPiece: EGG_PRICE_PER_PIECE,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch {
    return NextResponse.json(
      { error: "Failed to add egg entry" },
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
        { error: "Only managers can remove egg entries" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const validation = deleteEggEntryRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { memberId, month, date } = validation.data;

    const db = await getDb();
    const eggEntries = db.collection<EggEntry>("eggEntries");

    const result = await eggEntries.deleteOne({
      memberId: new ObjectId(memberId),
      month,
      date,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Egg entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove egg entry" },
      { status: 500 }
    );
  }
}
